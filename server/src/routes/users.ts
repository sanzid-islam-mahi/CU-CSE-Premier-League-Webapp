import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, generateRandomTempPassword } from "../lib/auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const usersRouter = Router();

const createUserSchema = z.object({
  studentId: z.string().min(1, "Student ID / Roll is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
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
    email: z.string().optional(),
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
      temporaryPlainPassword: u.temporaryPlainPassword,
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

// GET single user profile (by ID or Student Roll)
usersRouter.get("/:idOrRoll", async (req, res) => {
  try {
    const { idOrRoll } = req.params;
    const isIdNum = !isNaN(Number(idOrRoll)) && idOrRoll.length < 6; // usually id is small integer, rolls are 8 digits

    const user = await prisma.user.findFirst({
      where: isIdNum
        ? { id: Number(idOrRoll) }
        : { OR: [{ studentId: idOrRoll }, { id: isNaN(Number(idOrRoll)) ? undefined : Number(idOrRoll) }] },
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
        mediaAssets: {
          orderBy: { createdAt: "desc" }
        }
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
      coverUrl: user.coverUrl,
      mediaAssets: user.mediaAssets,
      teams: user.teamMemberships.map(tm => ({
        id: tm.team.id,
        name: tm.team.name,
        shortName: tm.team.shortName,
        logoUrl: tm.team.logoUrl,
        tournament: tm.team.tournament,
        jerseyNumber: tm.jerseyNumber,
        isCaptain: tm.isCaptain,
      })),
      organizerIn: user.organizerTournaments.map(ot => ot.tournament),
      captainIn: user.captainTeams.map(ct => ({ id: ct.id, name: ct.name, shortName: ct.shortName, tournamentId: ct.tournamentId })),
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch user profile" });
  }
});

// UPDATE User Profile (Owner or Admin)
usersRouter.put("/:id/profile", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const authUser = req.user;

    if (authUser.role !== "ADMIN" && authUser.id !== id) {
      res.status(403).json({ error: "You can only update your own profile." });
      return;
    }

    const {
      name,
      bio,
      phone,
      avatarUrl,
      coverUrl,
      cricketRole,
      battingStyle,
      bowlingStyle,
      footballPosition,
      preferredJerseyNo,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        bio: bio !== undefined ? bio : undefined,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
        cricketRole: cricketRole !== undefined ? cricketRole : undefined,
        battingStyle: battingStyle !== undefined ? battingStyle : undefined,
        bowlingStyle: bowlingStyle !== undefined ? bowlingStyle : undefined,
        footballPosition: footballPosition !== undefined ? footballPosition : undefined,
        preferredJerseyNo: preferredJerseyNo !== undefined ? (preferredJerseyNo ? Number(preferredJerseyNo) : null) : undefined,
      },
      include: {
        batch: true,
      }
    });

    res.json({
      message: "Profile updated successfully.",
      user: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update profile." });
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
    const resolvedEmail = (email && email.trim()) ? email.toLowerCase().trim() : `${studentId}@cse.cu.ac.bd`;

    // Check duplicate studentId or email
    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId },
          { email: resolvedEmail }
        ]
      }
    });

    if (duplicate) {
      res.status(400).json({ error: `User with Roll ${studentId} or Email ${resolvedEmail} already exists.` });
      return;
    }

    const plainPassword = temporaryPassword || generateRandomTempPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const user = await prisma.user.create({
      data: {
        studentId,
        name,
        email: resolvedEmail,
        password: hashedPassword,
        isTemporaryPassword: true,
        temporaryPlainPassword: plainPassword,
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
      temporaryPlainPassword: user.temporaryPlainPassword,
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
        const rowEmail = (row.email && row.email.trim()) ? row.email.toLowerCase().trim() : `${row.roll}@cse.cu.ac.bd`;

        const existing = await prisma.user.findFirst({
          where: {
            OR: [{ studentId: row.roll }, { email: rowEmail }]
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

        const plainPass = generateRandomTempPassword();
        const hashed = await hashPassword(plainPass);

        await prisma.user.create({
          data: {
            studentId: row.roll,
            name: row.name,
            email: rowEmail,
            password: hashed,
            isTemporaryPassword: true,
            temporaryPlainPassword: plainPass,
            batchId: resolvedBatchId,
            role: "USER",
            cricketRole: row.role || null,
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

    const newTempPassword = generateRandomTempPassword();
    const hashedPassword = await hashPassword(newTempPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        isTemporaryPassword: true,
        temporaryPlainPassword: newTempPassword,
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

// DELETE User / Player (Admin Only)
usersRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Prevent deleting main admin
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (targetUser.role === "ADMIN" && targetUser.email === "admin@cse.cu.ac.bd") {
      res.status(400).json({ error: "Cannot delete the default department administrator account." });
      return;
    }

    // Delete associated mappings (organizer, match scorers, team memberships)
    await prisma.tournamentOrganizer.deleteMany({ where: { userId: id } });
    await prisma.matchScorer.deleteMany({ where: { userId: id } });
    await prisma.teamMember.deleteMany({ where: { userId: id } });
    await prisma.matchSquad.deleteMany({ where: { userId: id } });

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: `User ${targetUser.name} (Roll: ${targetUser.studentId}) deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
});

export default usersRouter;

