import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const batchesRouter = Router();

const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  session: z.string().min(1, "Session is required"),
  batchNumber: z.number().int().positive("Batch number must be positive"),
  slogan: z.string().optional(),
  avatarUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
});

// GET all batches
batchesRouter.get("/", async (_req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { batchNumber: "asc" },
      include: {
        moderators: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: {
            users: true,
            teams: true,
            mediaAssets: true,
          }
        }
      }
    });

    const formatted = batches.map(b => ({
      id: b.id,
      name: b.name,
      session: b.session,
      batchNumber: b.batchNumber,
      slug: b.slug,
      slogan: b.slogan,
      avatarUrl: b.avatarUrl,
      bannerUrl: b.bannerUrl,
      studentsCount: b._count.users,
      teamsCount: b._count.teams,
      photosCount: b._count.mediaAssets,
      moderators: b.moderators.map(m => ({
        id: m.user.id,
        name: m.user.name,
        roll: m.user.studentId,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl
      })),
      createdAt: b.createdAt,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch batches" });
  }
});

// GET single batch by ID or Slug
batchesRouter.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));

    const batch = await prisma.batch.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        moderators: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, email: true, avatarUrl: true, cricketRole: true, footballPosition: true }
            }
          }
        },
        users: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            cricketRole: true,
            footballPosition: true,
            avatarUrl: true,
            isTemporaryPassword: true,
          },
          orderBy: { studentId: "asc" }
        },
        teams: {
          include: {
            tournament: {
              select: { id: true, name: true, sport: true, season: true, status: true }
            }
          }
        },
        mediaAssets: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: { id: true, name: true, studentId: true, avatarUrl: true }
            }
          }
        }
      }
    });

    if (!batch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }

    res.json({
      ...batch,
      moderators: batch.moderators.map(m => ({
        id: m.user.id,
        name: m.user.name,
        roll: m.user.studentId,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        cricketRole: m.user.cricketRole,
        footballPosition: m.user.footballPosition,
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch batch" });
  }
});

// CREATE Batch (Admin Only)
batchesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = createBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid batch input" });
      return;
    }

    const { name, session, batchNumber, slogan, avatarUrl, bannerUrl } = parsed.data;
    const slug = `batch-${batchNumber}`;

    // Check if slug already exists
    const existing = await prisma.batch.findUnique({
      where: { slug }
    });

    if (existing) {
      res.status(400).json({ error: `A batch with number ${batchNumber} (${slug}) already exists.` });
      return;
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        session,
        batchNumber,
        slug,
        slogan: slogan || null,
        avatarUrl: avatarUrl || null,
        bannerUrl: bannerUrl || null,
      },
      include: {
        _count: {
          select: {
            users: true,
            teams: true,
          }
        }
      }
    });

    res.status(201).json({
      id: batch.id,
      name: batch.name,
      session: batch.session,
      batchNumber: batch.batchNumber,
      slug: batch.slug,
      slogan: batch.slogan,
      avatarUrl: batch.avatarUrl,
      bannerUrl: batch.bannerUrl,
      studentsCount: batch._count.users,
      teamsCount: batch._count.teams,
      moderators: [],
      createdAt: batch.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create batch" });
  }
});

// ASSIGN Batch Moderator (Admin Only)
batchesRouter.post("/:id/moderators", requireAuth, requireAdmin, async (req, res) => {
  try {
    const batchId = Number(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required." });
      return;
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      res.status(404).json({ error: "Batch not found." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    await prisma.batchModerator.upsert({
      where: {
        batchId_userId: { batchId, userId: Number(userId) }
      },
      update: {},
      create: {
        batchId,
        userId: Number(userId)
      }
    });

    res.status(201).json({ message: `Assigned ${user.name} as Batch Moderator.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to assign batch moderator." });
  }
});

// REMOVE Batch Moderator (Admin Only)
batchesRouter.delete("/:id/moderators/:userId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const batchId = Number(req.params.id);
    const userId = Number(req.params.userId);

    await prisma.batchModerator.deleteMany({
      where: { batchId, userId }
    });

    res.json({ message: "Removed batch moderator." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove batch moderator." });
  }
});

// UPDATE Batch (Admin or Batch Moderator)
batchesRouter.put("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const isAdmin = req.user.role === "ADMIN";
    const isMod = isAdmin || await prisma.batchModerator.findUnique({
      where: {
        batchId_userId: {
          batchId: id,
          userId: req.user.id,
        }
      }
    });

    if (!isMod) {
      res.status(403).json({ error: "Access denied. Only Batch Moderators or Admins can update batch details." });
      return;
    }

    const { name, session, batchNumber, slogan, avatarUrl, bannerUrl } = req.body;

    let slug: string | undefined = undefined;
    if (isAdmin && batchNumber !== undefined && Number(batchNumber) > 0) {
      slug = `batch-${Number(batchNumber)}`;
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        name: isAdmin ? (name || undefined) : undefined,
        session: isAdmin ? (session || undefined) : undefined,
        batchNumber: isAdmin ? (batchNumber !== undefined ? Number(batchNumber) : undefined) : undefined,
        slug: isAdmin ? (slug || undefined) : undefined,
        slogan: slogan !== undefined ? slogan : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
      },
      include: {
        moderators: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: {
            users: true,
            teams: true,
            mediaAssets: true,
          }
        }
      }
    });

    res.json({
      id: batch.id,
      name: batch.name,
      session: batch.session,
      batchNumber: batch.batchNumber,
      slug: batch.slug,
      slogan: batch.slogan,
      avatarUrl: batch.avatarUrl,
      bannerUrl: batch.bannerUrl,
      studentsCount: batch._count.users,
      teamsCount: batch._count.teams,
      photosCount: batch._count.mediaAssets,
      moderators: batch.moderators.map(m => ({
        id: m.user.id,
        name: m.user.name,
        roll: m.user.studentId,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl
      })),
      createdAt: batch.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update batch" });
  }
});

// DELETE Batch (Admin Only)
batchesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Disassociate users from this batch so users are not orphaned/errored
    await prisma.user.updateMany({
      where: { batchId: id },
      data: { batchId: null },
    });

    // Delete teams tied to batch
    await prisma.team.deleteMany({
      where: { batchId: id }
    });

    await prisma.batch.delete({
      where: { id }
    });

    res.json({ message: "Batch deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete batch" });
  }
});

export default batchesRouter;

