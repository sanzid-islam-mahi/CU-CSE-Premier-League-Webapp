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

    res.json(batch);
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
      createdAt: batch.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create batch" });
  }
});

// UPDATE Batch (Admin Only)
batchesRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, session, slogan, avatarUrl, bannerUrl } = req.body;

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        name: name || undefined,
        session: session || undefined,
        slogan: slogan !== undefined ? slogan : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
      }
    });

    res.json(batch);
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

