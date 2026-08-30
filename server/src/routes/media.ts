import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const mediaRouter = Router();

const createMediaSchema = z.object({
  title: z.string().optional(),
  caption: z.string().optional(),
  url: z.string().min(1, "Media URL is required"),
  thumbnailUrl: z.string().optional(),
  category: z.enum([
    "TOURNAMENT_LOGO",
    "TOURNAMENT_BANNER",
    "TOURNAMENT_GALLERY",
    "MATCH_PHOTO",
    "BATCH_AVATAR",
    "BATCH_BANNER",
    "BATCH_GALLERY",
    "TEAM_LOGO",
    "TEAM_BANNER",
    "PLAYER_AVATAR",
    "PLAYER_COVER",
    "SPONSOR_LOGO",
    "AWARD_CEREMONY",
  ]).default("TOURNAMENT_GALLERY"),
  tournamentId: z.number().int().positive().optional().nullable(),
  matchId: z.number().int().positive().optional().nullable(),
  batchId: z.number().int().positive().optional().nullable(),
  teamId: z.number().int().positive().optional().nullable(),
  userId: z.number().int().positive().optional().nullable(),
  isFeatured: z.boolean().optional(),
});

// GET /api/media - Query media assets with filters
mediaRouter.get("/", async (req, res) => {
  try {
    const {
      tournamentId,
      matchId,
      batchId,
      teamId,
      userId,
      category,
      isFeatured,
      limit = "50",
    } = req.query;

    const where: any = {};

    if (tournamentId) where.tournamentId = Number(tournamentId);
    if (matchId) where.matchId = Number(matchId);
    if (batchId) where.batchId = Number(batchId);
    if (teamId) where.teamId = Number(teamId);
    if (userId) where.userId = Number(userId);
    if (category) where.category = category;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";

    const media = await prisma.mediaAsset.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: Math.min(100, Number(limit) || 50),
      include: {
        uploadedBy: {
          select: { id: true, name: true, studentId: true, avatarUrl: true },
        },
        batch: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
        team: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        tournament: {
          select: { id: true, name: true, slug: true, sport: true, season: true },
        },
      },
    });

    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch media assets." });
  }
});

// POST /api/media - Create/Record media asset
mediaRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid media data." });
      return;
    }

    const {
      title,
      caption,
      url,
      thumbnailUrl,
      category,
      tournamentId,
      matchId,
      batchId,
      teamId,
      userId,
      isFeatured,
    } = parsed.data;

    // If uploading batch media, require Admin or Batch Moderator
    if (batchId) {
      const isAdmin = req.user?.role === "ADMIN";
      const isMod = isAdmin || await prisma.batchModerator.findUnique({
        where: {
          batchId_userId: {
            batchId: Number(batchId),
            userId: req.user!.id,
          }
        }
      });

      if (!isMod) {
        res.status(403).json({ error: "Access denied. Only Batch Moderators or Admins can upload photos for this batch." });
        return;
      }
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        title: title || null,
        caption: caption || null,
        url,
        thumbnailUrl: thumbnailUrl || url,
        category,
        tournamentId: tournamentId || null,
        matchId: matchId || null,
        batchId: batchId || null,
        teamId: teamId || null,
        userId: userId || null,
        uploadedById: req.user?.id || null,
        isFeatured: isFeatured || false,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, studentId: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save media asset." });
  }
});

// DELETE /api/media/:id - Delete media asset
mediaRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.mediaAsset.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: "Media asset not found." });
      return;
    }

    // Allow deletion if user is admin, original uploader, or Batch Moderator for this batch
    const isAdmin = req.user?.role === "ADMIN";
    const isUploader = req.user?.id === existing.uploadedById;
    let isBatchMod = false;

    if (existing.batchId && req.user) {
      isBatchMod = !!(await prisma.batchModerator.findUnique({
        where: {
          batchId_userId: {
            batchId: existing.batchId,
            userId: req.user.id,
          }
        }
      }));
    }

    if (!isAdmin && !isUploader && !isBatchMod) {
      res.status(403).json({ error: "You are not authorized to delete this media asset." });
      return;
    }

    await prisma.mediaAsset.delete({ where: { id } });
    res.json({ message: "Media asset deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete media asset." });
  }
});

export default mediaRouter;
