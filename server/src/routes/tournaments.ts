import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const tournamentsRouter = Router();

const createTournamentSchema = z.object({
  name: z.string().min(1, "Tournament title is required"),
  sport: z.enum(["CRICKET", "FOOTBALL"]),
  season: z.string().min(1, "Season is required"),
  status: z.enum(["DRAFT", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  rules: z.any().optional(),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const assignOrganizerSchema = z.object({
  userId: z.number().int().positive("Valid user ID is required"),
});

// GET all tournaments
tournamentsRouter.get("/", async (req, res) => {
  try {
    const { sport, status } = req.query;
    const where: any = {};

    if (sport && (sport === "CRICKET" || sport === "FOOTBALL")) {
      where.sport = sport;
    }

    if (status && typeof status === "string") {
      where.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organizers: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, email: true, batchId: true }
            }
          }
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          }
        }
      }
    });

    const formatted = tournaments.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      sport: t.sport,
      season: t.season,
      status: t.status,
      bannerUrl: t.bannerUrl,
      logoUrl: t.logoUrl,
      rules: t.rules,
      startDate: t.startDate,
      endDate: t.endDate,
      teamsCount: t._count.teams,
      matchesCount: t._count.matches,
      organizers: t.organizers.map(o => ({
        id: o.user.id,
        name: o.user.name,
        roll: o.user.studentId,
        email: o.user.email,
      })),
      createdAt: t.createdAt,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tournaments" });
  }
});

// GET single tournament
tournamentsRouter.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));

    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        organizers: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, email: true, batch: true }
            }
          }
        },
        teams: {
          include: {
            captain: {
              select: { id: true, name: true, studentId: true }
            },
            batch: true,
            _count: {
              select: { members: true }
            }
          }
        },
        groups: true,
        matches: {
          include: {
            teamA: { select: { id: true, name: true, shortName: true } },
            teamB: { select: { id: true, name: true, shortName: true } },
            winnerTeam: { select: { id: true, name: true } },
          },
          orderBy: { matchNumber: "asc" }
        }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    res.json(tournament);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tournament" });
  }
});

// CREATE Tournament (Admin Only)
tournamentsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = createTournamentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid tournament input" });
      return;
    }

    const { name, sport, season, status, rules, bannerUrl, logoUrl, startDate, endDate } = parsed.data;

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slug = baseSlug;
    const existing = await prisma.tournament.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        slug,
        sport,
        season,
        status: status || "UPCOMING",
        rules: rules || null,
        bannerUrl: bannerUrl || null,
        logoUrl: logoUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        organizers: true,
        _count: { select: { teams: true, matches: true } }
      }
    });

    res.status(201).json({
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      sport: tournament.sport,
      season: tournament.season,
      status: tournament.status,
      rules: tournament.rules,
      teamsCount: tournament._count.teams,
      matchesCount: tournament._count.matches,
      organizers: [],
      createdAt: tournament.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create tournament" });
  }
});

// ASSIGN ORGANIZER to Tournament (Admin Only)
tournamentsRouter.post("/:id/organizers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const parsed = assignOrganizerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid user ID" });
      return;
    }

    const { userId } = parsed.data;

    // Check tournament exists
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if already assigned
    const existing = await prisma.tournamentOrganizer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: `${user.name} is already an organizer for this tournament.` });
      return;
    }

    const organizerEntry = await prisma.tournamentOrganizer.create({
      data: {
        tournamentId,
        userId,
      },
      include: {
        user: {
          select: { id: true, studentId: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      message: `Assigned ${user.name} as organizer for ${tournament.name}.`,
      organizer: {
        id: organizerEntry.user.id,
        name: organizerEntry.user.name,
        roll: organizerEntry.user.studentId,
        email: organizerEntry.user.email,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to assign organizer" });
  }
});

// REMOVE ORGANIZER from Tournament (Admin Only)
tournamentsRouter.delete("/:id/organizers/:userId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const userId = Number(req.params.userId);

    await prisma.tournamentOrganizer.deleteMany({
      where: {
        tournamentId,
        userId,
      }
    });

    res.json({ message: "Organizer permission removed successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove organizer" });
  }
});

// DELETE Tournament (Admin Only)
tournamentsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    // Cascade delete relations: organizers, groups, matches, teams
    await prisma.tournamentOrganizer.deleteMany({ where: { tournamentId: id } });
    await prisma.matchScorer.deleteMany({
      where: { match: { tournamentId: id } }
    });
    await prisma.matchSquad.deleteMany({
      where: { match: { tournamentId: id } }
    });
    await prisma.cricketBall.deleteMany({
      where: { innings: { match: { tournamentId: id } } }
    });
    await prisma.cricketBattingScorecard.deleteMany({
      where: { innings: { match: { tournamentId: id } } }
    });
    await prisma.cricketBowlingScorecard.deleteMany({
      where: { innings: { match: { tournamentId: id } } }
    });
    await prisma.cricketInnings.deleteMany({
      where: { match: { tournamentId: id } }
    });
    await prisma.footballMatchEvent.deleteMany({
      where: { match: { tournamentId: id } }
    });
    await prisma.footballMatchDetail.deleteMany({
      where: { match: { tournamentId: id } }
    });
    await prisma.match.deleteMany({ where: { tournamentId: id } });
    await prisma.teamMember.deleteMany({
      where: { team: { tournamentId: id } }
    });
    await prisma.team.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentGroup.deleteMany({ where: { tournamentId: id } });

    await prisma.tournament.delete({
      where: { id }
    });

    res.json({ message: `Tournament "${tournament.name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete tournament" });
  }
});

export default tournamentsRouter;

