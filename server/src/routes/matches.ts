import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { isOrganizerOrAdmin } from "../middleware/organizerAuth.js";
import { advanceTournamentKnockouts } from "../lib/knockoutProgression.js";

const matchesRouter = Router();

const scheduleMatchSchema = z.object({
  teamAId: z.number().int().positive(),
  teamBId: z.number().int().positive(),
  groupId: z.number().int().positive().optional().nullable(),
  stage: z.enum(["GROUP_STAGE", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]).optional(),
  startTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  matchNumber: z.number().int().positive().optional(),
});

const updateMatchSchema = z.object({
  teamAId: z.number().int().positive().optional(),
  teamBId: z.number().int().positive().optional(),
  groupId: z.number().int().positive().optional().nullable(),
  status: z.enum(["SCHEDULED", "TOSS", "LIVE", "INNINGS_BREAK", "HALFTIME", "COMPLETED", "ABANDONED", "POSTPONED"]).optional(),
  startTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  resultSummary: z.string().optional().nullable(),
  winnerTeamId: z.number().int().positive().optional().nullable(),
  isTied: z.boolean().optional(),
  isNoResult: z.boolean().optional(),
  playerOfTheMatchId: z.number().int().positive().optional().nullable(),
  stage: z.enum(["GROUP_STAGE", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]).optional(),
});

// GET matches with optional filters
matchesRouter.get("/", async (req, res) => {
  try {
    const { sport, status, tournamentId, limit } = req.query;

    const where: any = {};

    if (tournamentId) {
      where.tournamentId = Number(tournamentId);
    }

    if (sport) {
      where.tournament = {
        sport: String(sport).toUpperCase() as "CRICKET" | "FOOTBALL",
      };
    }

    if (status) {
      const statusStr = String(status);
      if (statusStr.includes(",")) {
        where.status = { in: statusStr.split(",").map(s => s.trim()) };
      } else if (statusStr !== "ALL") {
        where.status = statusStr;
      }
    }

    const takeLimit = limit ? Math.min(Number(limit), 50) : 20;

    const matches = await prisma.match.findMany({
      where,
      take: takeLimit,
      orderBy: [
        { status: "asc" }, // LIVE usually prioritized by specific query or custom sort
        { startTime: "asc" },
        { id: "desc" },
      ],
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            slug: true,
            sport: true,
            season: true,
            status: true,
            rules: true,
            bannerUrl: true,
            logoUrl: true,
          }
        },
        group: { select: { id: true, name: true } },
        teamA: {
          include: {
            batch: true,
            captain: { select: { id: true, name: true, studentId: true, avatarUrl: true } }
          }
        },
        teamB: {
          include: {
            batch: true,
            captain: { select: { id: true, name: true, studentId: true, avatarUrl: true } }
          }
        },
        winnerTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        playerOfTheMatch: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
        cricketInnings: {
          include: {
            battingScorecards: {
              include: { player: { select: { id: true, name: true, studentId: true, avatarUrl: true, cricketRole: true } } },
              orderBy: { battingOrder: "asc" }
            },
            bowlingScorecards: {
              include: { player: { select: { id: true, name: true, studentId: true, avatarUrl: true, bowlingStyle: true } } },
              orderBy: { bowlingOrder: "asc" }
            },
            balls: {
              take: 6,
              orderBy: { id: "desc" },
              include: {
                bowler: { select: { id: true, name: true } },
                striker: { select: { id: true, name: true } },
              }
            }
          },
          orderBy: { inningsNumber: "asc" }
        },
        footballDetail: true,
        footballEvents: {
          include: {
            primaryPlayer: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
            secondaryPlayer: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
          },
          orderBy: { minute: "asc" }
        }
      }
    });

    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch matches" });
  }
});

// GET single match
matchesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        group: true,
        teamA: {
          include: {
            captain: true,
            batch: true,
            members: { include: { user: true } }
          }
        },
        teamB: {
          include: {
            captain: true,
            batch: true,
            members: { include: { user: true } }
          }
        },
        winnerTeam: true,
        playerOfTheMatch: true,
        scorers: {
          include: {
            user: { select: { id: true, name: true, studentId: true, email: true } }
          }
        },
        cricketInnings: {
          include: {
            battingScorecards: { include: { player: true }, orderBy: { battingOrder: "asc" } },
            bowlingScorecards: { include: { player: true }, orderBy: { bowlingOrder: "asc" } },
          },
          orderBy: { inningsNumber: "asc" }
        },
        footballDetail: true,
        footballEvents: {
          include: {
            primaryPlayer: true,
            secondaryPlayer: true,
          },
          orderBy: { minute: "asc" }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    res.json(match);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch match" });
  }
});

// CREATE / Schedule Match in Tournament (Organizer or Admin)
matchesRouter.post("/tournament/:idOrSlug", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const slugStr = String(idOrSlug);
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: slugStr }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, tournament.id);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Organizers or Admin can schedule matches." });
      return;
    }

    const parsed = scheduleMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid match schedule data" });
      return;
    }

    const { teamAId, teamBId, groupId, stage, startTime, venue, matchNumber } = parsed.data;

    if (teamAId === teamBId) {
      res.status(400).json({ error: "A team cannot play against itself." });
      return;
    }

    // Auto calculate match number if not provided
    let resolvedMatchNumber = matchNumber;
    if (!resolvedMatchNumber) {
      const highest = await prisma.match.findFirst({
        where: { tournamentId: tournament.id },
        orderBy: { matchNumber: "desc" }
      });
      resolvedMatchNumber = (highest?.matchNumber || 0) + 1;
    }

    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        groupId: groupId || null,
        stage: stage || "GROUP_STAGE",
        teamAId,
        teamBId,
        matchNumber: resolvedMatchNumber,
        startTime: startTime ? new Date(startTime) : null,
        venue: venue || (tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field"),
        status: "SCHEDULED",
      },
      include: {
        teamA: true,
        teamB: true,
        group: true,
      }
    });

    // Initialize sport specific details
    if (tournament.sport === "FOOTBALL") {
      await prisma.footballMatchDetail.create({
        data: {
          matchId: match.id,
          halfDurationMinutes: 20,
        }
      });
    }

    res.status(201).json(match);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create match fixture" });
  }
});

// AUTO-GENERATE ROUND ROBIN FIXTURES (Group Stage Generator)
matchesRouter.post("/tournament/:idOrSlug/generate-round-robin", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const slugStr = String(idOrSlug);
    const tournament: any = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: slugStr },
      include: {
        groups: { 
          include: { 
            teams: true 
          } 
        },
        teams: true,
        matches: {
          orderBy: { matchNumber: "asc" }
        },
      }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, tournament.id);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Tournament Organizers can generate fixtures." });
      return;
    }

    // Delete any existing un-played SCHEDULED group stage matches to ensure clean schedule
    await prisma.match.deleteMany({
      where: {
        tournamentId: tournament.id,
        stage: "GROUP_STAGE",
        status: "SCHEDULED",
      }
    });

    // Determine starting match number based on any remaining completed/live matches
    const remainingMatches = await prisma.match.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { matchNumber: "desc" }
    });
    let nextMatchNumber = remainingMatches.length > 0 ? (remainingMatches[0].matchNumber + 1) : 1;

    const createdMatches: any[] = [];
    const defaultVenue = tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field";

    // Helper to generate unique pairings within a list of teams
    const generatePairs = (teamList: any[], groupId: number | null) => {
      const pairs: Array<{ teamAId: number; teamBId: number; groupId: number | null }> = [];
      for (let i = 0; i < teamList.length; i++) {
        for (let j = i + 1; j < teamList.length; j++) {
          pairs.push({
            teamAId: teamList[i].id,
            teamBId: teamList[j].id,
            groupId,
          });
        }
      }
      return pairs;
    };

    let allPairs: Array<{ teamAId: number; teamBId: number; groupId: number | null }> = [];

    if (tournament.groups && tournament.groups.length > 0) {
      // Group-based tournament: strictly generate round-robin matches WITHIN each group
      for (const g of tournament.groups) {
        if (g.teams && g.teams.length >= 2) {
          allPairs = allPairs.concat(generatePairs(g.teams, g.id));
        }
      }
    } else {
      // General single-pool tournament: all teams play round-robin
      if (tournament.teams && tournament.teams.length >= 2) {
        allPairs = allPairs.concat(generatePairs(tournament.teams, null));
      }
    }

    if (allPairs.length === 0) {
      res.status(400).json({ 
        error: tournament.groups?.length > 0
          ? "Please allocate at least 2 teams into your groups before generating fixtures."
          : "At least 2 teams are required in the tournament to generate fixtures." 
      });
      return;
    }

    for (const pair of allPairs) {
      const m = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          groupId: pair.groupId,
          stage: "GROUP_STAGE",
          matchNumber: nextMatchNumber++,
          teamAId: pair.teamAId,
          teamBId: pair.teamBId,
          venue: defaultVenue,
          status: "SCHEDULED",
        },
        include: {
          teamA: { select: { id: true, name: true, shortName: true } },
          teamB: { select: { id: true, name: true, shortName: true } },
          group: { select: { id: true, name: true } }
        }
      });

      if (tournament.sport === "FOOTBALL") {
        await prisma.footballMatchDetail.create({
          data: { matchId: m.id, halfDurationMinutes: 20 }
        });
      }

      createdMatches.push(m);
    }

    res.status(201).json({
      message: `Successfully generated ${createdMatches.length} group stage match fixtures (${tournament.groups?.length > 0 ? `${tournament.groups.length} groups` : "Single pool"}).`,
      count: createdMatches.length,
      fixtures: createdMatches,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate round robin fixtures" });
  }
});

// CLEAR / DELETE ALL SCHEDULED FIXTURES IN TOURNAMENT
matchesRouter.delete("/tournament/:idOrSlug/matches/scheduled", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const slugStr = String(idOrSlug);
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: slugStr }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, tournament.id);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Tournament Organizers can clear fixtures." });
      return;
    }

    const result = await prisma.match.deleteMany({
      where: {
        tournamentId: tournament.id,
        status: "SCHEDULED"
      }
    });

    res.json({ message: `Successfully cleared ${result.count} scheduled matches.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clear scheduled fixtures" });
  }
});

// GENERATE KNOCKOUT BRACKET FIXTURES (Semi-Finals & Final)
matchesRouter.post("/tournament/:idOrSlug/generate-knockouts", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const slugStr = String(idOrSlug);
    const tournament: any = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: slugStr },
      include: {
        groups: { include: { teams: true } },
        teams: true,
        matches: { orderBy: { matchNumber: "desc" } }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, tournament.id);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Tournament Organizers can generate knockout fixtures." });
      return;
    }

    // Strict Lifecycle Validation: All group stage matches must be COMPLETED first
    const groupMatches = await prisma.match.findMany({
      where: { tournamentId: tournament.id, stage: "GROUP_STAGE" }
    });
    const uncompletedGroupMatches = groupMatches.filter(m => m.status !== "COMPLETED");

    if (groupMatches.length > 0 && uncompletedGroupMatches.length > 0) {
      res.status(400).json({
        error: `Cannot generate knockout fixtures yet: ${uncompletedGroupMatches.length} of ${groupMatches.length} group stage match(es) are still in progress. Knockout fixtures can only be seeded once all group matches are finished and the points table is finalized.`
      });
      return;
    }

    if (groupMatches.length > 0) {
      // Trigger the official unified knockout progression engine
      await advanceTournamentKnockouts(prisma, groupMatches[0].id);
    }

    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        stage: { in: ["SEMI_FINAL", "FINAL", "THIRD_PLACE"] }
      },
      include: { teamA: true, teamB: true }
    });

    res.status(201).json({
      message: "Successfully synchronized Knockout Bracket fixtures from official standings!",
      matches: knockoutMatches
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate knockout bracket" });
  }
});

// UPDATE Match Details (Organizer or Admin)
matchesRouter.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, match.tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Organizers or Admin can edit matches." });
      return;
    }

    // Strict Security Guard: Completed matches can only be altered by Super Admin
    if (match.status === "COMPLETED" && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Access denied. Completed matches are finalized and can only be modified by the Super Admin." });
      return;
    }

    const parsed = updateMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { 
      teamAId,
      teamBId,
      groupId,
      status, 
      startTime, 
      venue, 
      resultSummary, 
      winnerTeamId, 
      isTied, 
      isNoResult, 
      playerOfTheMatchId, 
      stage 
    } = parsed.data;

    const updated = await prisma.match.update({
      where: { id },
      data: {
        teamAId: teamAId !== undefined ? teamAId : undefined,
        teamBId: teamBId !== undefined ? teamBId : undefined,
        groupId: groupId !== undefined ? groupId : undefined,
        status: status !== undefined ? status : undefined,
        startTime: startTime !== undefined ? (startTime ? new Date(startTime) : null) : undefined,
        venue: venue !== undefined ? venue : undefined,
        resultSummary: resultSummary !== undefined ? resultSummary : undefined,
        winnerTeamId: winnerTeamId !== undefined ? winnerTeamId : undefined,
        isTied: isTied !== undefined ? isTied : undefined,
        isNoResult: isNoResult !== undefined ? isNoResult : undefined,
        playerOfTheMatchId: playerOfTheMatchId !== undefined ? playerOfTheMatchId : undefined,
        stage: stage !== undefined ? stage : undefined,
      },
      include: {
        teamA: true,
        teamB: true,
        group: true,
        winnerTeam: true,
        playerOfTheMatch: true,
      }
    });

    // Auto-advance tournament knockouts (Group Stage -> Semi Finals, Semi Finals -> Final, Final -> Crown Victor)
    if (status === "COMPLETED" || updated.status === "COMPLETED") {
      await advanceTournamentKnockouts(prisma, id);
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update match" });
  }
});

// DELETE Match Fixture (Organizer or Admin)
matchesRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, match.tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Organizers or Admin can delete matches." });
      return;
    }

    await prisma.match.delete({ where: { id } });
    res.json({ message: "Match fixture deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete match fixture" });
  }
});

// ASSIGN SCORER to Match
matchesRouter.post("/:id/scorers", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, match.tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only Organizers or Admin can delegate scorers." });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "Valid userId is required" });
      return;
    }

    const entry = await prisma.matchScorer.upsert({
      where: { matchId_userId: { matchId, userId: Number(userId) } },
      update: {},
      create: { matchId, userId: Number(userId) },
      include: {
        user: { select: { id: true, name: true, studentId: true } }
      }
    });

    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to assign scorer" });
  }
});

// REMOVE SCORER from Match
matchesRouter.delete("/:id/scorers/:userId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const allowed = await isOrganizerOrAdmin(req.user!.id, req.user!.role, match.tournamentId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await prisma.matchScorer.deleteMany({
      where: { matchId, userId }
    });

    res.json({ message: "Scorer unassigned successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove scorer" });
  }
});

export default matchesRouter;
