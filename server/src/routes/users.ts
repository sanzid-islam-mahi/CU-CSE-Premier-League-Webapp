import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword } from "../lib/auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const usersRouter = Router();

const createUserSchema = z.object({
  studentId: z.string().min(1, "Student ID / Roll is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  batchId: z.number().int().positive().optional().nullable(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  cricketRole: z.string().optional(),
  footballPosition: z.string().optional(),
  temporaryPassword: z.string().optional(),
});

const bulkImportSchema = z.array(
  z.object({
    roll: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    batch: z.string().optional(), // e.g. "20th Batch" or "20"
    role: z.string().optional(),
  })
);

// GET all users / players with search & filters
usersRouter.get("/", async (req, res) => {
  try {
    const { search, batchId, role } = req.query;

    const where: any = {};

    if (batchId) {
      where.batchId = Number(batchId);
    }

    if (role && (role === "ADMIN" || role === "USER")) {
      where.role = role;
    }

    if (search && typeof search === "string") {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ batchId: "asc" }, { studentId: "asc" }],
      include: {
        batch: {
          select: { id: true, name: true, session: true, batchNumber: true }
        }
      }
    });

    const formatted = users.map(u => ({
      id: u.id,
      studentId: u.studentId,
      name: u.name,
      email: u.email,
      role: u.role,
      isTemporaryPassword: u.isTemporaryPassword,
      batch: u.batch ? u.batch.name : "Unassigned",
      batchId: u.batchId,
      cricketRole: u.cricketRole,
      footballPosition: u.footballPosition,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

// GET single user profile
usersRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        batch: true,
        teamMemberships: {
          include: {
            team: {
              include: {
                tournament: {
                  select: { id: true, name: true, sport: true, season: true, status: true }
                }
              }
            }
          }
        },
        organizerTournaments: {
          include: {
            tournament: true
          }
        },
        captainTeams: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
      batch: user.batch,
      phone: user.phone,
      bio: user.bio,
      cricketRole: user.cricketRole,
      battingStyle: user.battingStyle,
      bowlingStyle: user.bowlingStyle,
      footballPosition: user.footballPosition,
      preferredJerseyNo: user.preferredJerseyNo,
      avatarUrl: user.avatarUrl,
      teams: user.teamMemberships.map(tm => ({
        id: tm.team.id,
        name: tm.team.name,
        tournament: tm.team.tournament,
        jerseyNumber: tm.jerseyNumber,
        isCaptain: tm.isCaptain,
      })),
      organizerTournaments: user.organizerTournaments.map(ot => ot.tournament),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
});

// CREATE Single User (Admin Only)
usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid user input" });
      return;
    }

    const { studentId, name, email, batchId, role, cricketRole, footballPosition, temporaryPassword } = parsed.data;

    // Check duplicate studentId or email
    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (duplicate) {
      res.status(400).json({ error: `User with Roll ${studentId} or Email ${email} already exists.` });
      return;
    }

    const plainPassword = temporaryPassword || `CSEPL@${studentId}`;
    const hashedPassword = await hashPassword(plainPassword);

    const user = await prisma.user.create({
      data: {
        studentId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isTemporaryPassword: true,
        batchId: batchId || null,
        role: role || "USER",
        cricketRole: cricketRole || null,
        footballPosition: footballPosition || null,
      },
      include: {
        batch: true,
      }
    });

    res.status(201).json({
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
      batch: user.batch ? user.batch.name : "Unassigned",
      batchId: user.batchId,
      cricketRole: user.cricketRole,
      footballPosition: user.footballPosition,
      temporaryPasswordGenerated: plainPassword,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
});

// BULK IMPORT Players (CSV / Array JSON) (Admin Only)
usersRouter.post("/bulk", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = bulkImportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid bulk import payload structure." });
      return;
    }

    const rows = parsed.data;
    const allBatches = await prisma.batch.findMany();
    const batchMap = new Map<string, number>();
    for (const b of allBatches) {
      batchMap.set(b.name.toLowerCase(), b.id);
      batchMap.set(`${b.batchNumber}`, b.id);
      batchMap.set(`batch ${b.batchNumber}`, b.id);
    }

    let importedCount = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [{ studentId: row.roll }, { email: row.email.toLowerCase() }]
          }
        });

        if (existing) {
          skipped.push(row.roll);
          continue;
        }

        let resolvedBatchId: number | null = null;
        if (row.batch) {
          resolvedBatchId = batchMap.get(row.batch.toLowerCase().trim()) || null;
        }

        const plainPass = `CSEPL@${row.roll}`;
        const hashed = await hashPassword(plainPass);

        await prisma.user.create({
          data: {
            studentId: row.roll,
            name: row.name,
            email: row.email.toLowerCase(),
            password: hashed,
            isTemporaryPassword: true,
            batchId: resolvedBatchId,
            role: "USER",
            cricketRole: row.role || "🏏 All-Rounder",
          }
        });

        importedCount++;
      } catch {
        skipped.push(row.roll);
      }
    }

    res.json({
      message: `Bulk import completed. Successfully registered ${importedCount} players.`,
      importedCount,
      skippedCount: skipped.length,
      skippedRolls: skipped,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed bulk import" });
  }
});

// RESET TEMPORARY PASSWORD (Admin Only)
usersRouter.put("/:id/reset-temp-pass", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const randomDigits = Math.floor(100 + Math.random() * 900);
    const newTempPassword = `CSEPL@${user.studentId}_${randomDigits}`;
    const hashedPassword = await hashPassword(newTempPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        isTemporaryPassword: true,
      }
    });

    res.json({
      message: `Temporary password reset for ${user.name} (Roll: ${user.studentId}).`,
      temporaryPassword: newTempPassword,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reset password" });
  }
});

export default usersRouter;
