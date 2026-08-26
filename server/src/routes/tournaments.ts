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

// GET single tournament with all related models
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
              select: { id: true, studentId: true, name: true, email: true, batch: true, avatarUrl: true }
            }
          }
        },
        groups: {
          include: {
            teams: {
              include: {
                captain: { select: { id: true, name: true, studentId: true, avatarUrl: true } },
                batch: true,
                _count: { select: { members: true } }
              }
            }
          }
        },
        teams: {
          include: {
            captain: {
              select: { id: true, name: true, studentId: true, avatarUrl: true }
            },
            batch: true,
            group: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    studentId: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    cricketRole: true,
                    battingStyle: true,
                    bowlingStyle: true,
                    footballPosition: true,
                    preferredJerseyNo: true,
                  }
                }
              }
            },
            _count: {
              select: { members: true }
            }
          },
          orderBy: { name: "asc" }
        },
        matches: {
          include: {
            group: true,
            teamA: { select: { id: true, name: true, shortName: true, logoUrl: true } },
            teamB: { select: { id: true, name: true, shortName: true, logoUrl: true } },
            winnerTeam: { select: { id: true, name: true, shortName: true } },
            scorers: {
              include: {
                user: { select: { id: true, name: true, studentId: true } }
              }
            },
            cricketInnings: {
              select: {
                id: true,
                inningsNumber: true,
                battingTeamId: true,
                totalRuns: true,
                totalWickets: true,
                totalOvers: true,
                isCompleted: true,
              }
            },
            footballDetail: true,
          },
          orderBy: [{ startTime: "asc" }, { matchNumber: "asc" }]
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

// IMPORT BATCH AS TOURNAMENT TEAM (1-Click Batch to Squad Generator)
tournamentsRouter.post("/:idOrSlug/teams/import-batch", requireAuth, async (req: any, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    // Check organizer/admin rights
    const isOrg = req.user.role === "ADMIN" || await prisma.tournamentOrganizer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.user.id } }
    });
    if (!isOrg) {
      res.status(403).json({ error: "Access denied. Only Tournament Organizers can import batches." });
      return;
    }

    const { batchId, teamName, shortName, groupId } = req.body;
    if (!batchId) {
      res.status(400).json({ error: "Batch ID is required" });
      return;
    }

    const batch = await prisma.batch.findUnique({
      where: { id: Number(batchId) },
      include: { users: true }
    });

    if (!batch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }

    // Check if team for batch already exists in this tournament
    const existing = await prisma.team.findFirst({
      where: { tournamentId: tournament.id, batchId: batch.id }
    });

    if (existing) {
      res.status(400).json({ error: `Batch "${batch.name}" is already imported as "${existing.name}".` });
      return;
    }

    // Generate nice default team name (e.g. "Dwimik Gladiators", "Anabil Titans")
    const resolvedName = teamName?.trim() || `${batch.name} Warriors`;
    const resolvedShort = shortName?.trim() || (batch.batchNumber ? `B${batch.batchNumber}` : batch.name.slice(0, 4).toUpperCase());

    // Select first student as initial captain
    const firstStudent = batch.users[0];

    const team = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        batchId: batch.id,
        groupId: groupId ? Number(groupId) : null,
        name: resolvedName,
        shortName: resolvedShort,
        captainId: firstStudent ? firstStudent.id : null,
      }
    });

    // Populate team roster with all students registered in this batch
    if (batch.users.length > 0) {
      await prisma.teamMember.createMany({
        data: batch.users.map((u, idx) => ({
          teamId: team.id,
          userId: u.id,
          isCaptain: idx === 0,
          jerseyNumber: u.preferredJerseyNo || (idx + 1),
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      message: `Successfully imported "${batch.name}" as "${team.name}" with ${batch.users.length} squad players.`,
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      membersCount: batch.users.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to import batch" });
  }
});

// CREATE Tournament Group (e.g. Group A, Group B)
tournamentsRouter.post("/:idOrSlug/groups", requireAuth, async (req: any, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const isOrg = req.user.role === "ADMIN" || await prisma.tournamentOrganizer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.user.id } }
    });
    if (!isOrg) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Group name is required (e.g. 'Group A')" });
      return;
    }

    const group = await prisma.tournamentGroup.create({
      data: {
        tournamentId: tournament.id,
        name: name.trim(),
      }
    });

    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create group" });
  }
});

// ASSIGN TEAMS TO GROUP
tournamentsRouter.put("/:idOrSlug/groups/:groupId/teams", requireAuth, async (req: any, res) => {
  try {
    const { idOrSlug, groupId } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const isOrg = req.user.role === "ADMIN" || await prisma.tournamentOrganizer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.user.id } }
    });
    if (!isOrg) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { teamIds } = req.body;
    if (!Array.isArray(teamIds)) {
      res.status(400).json({ error: "teamIds must be an array of team IDs" });
      return;
    }

    await prisma.team.updateMany({
      where: {
        id: { in: teamIds },
        tournamentId: tournament.id,
      },
      data: {
        groupId: Number(groupId),
      }
    });

    res.json({ message: "Teams allocated to group successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to assign teams to group" });
  }
});

// DELETE Group
tournamentsRouter.delete("/:idOrSlug/groups/:groupId", requireAuth, async (req: any, res) => {
  try {
    const { idOrSlug, groupId } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const isOrg = req.user.role === "ADMIN" || await prisma.tournamentOrganizer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.user.id } }
    });
    if (!isOrg) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    // Disassociate teams
    await prisma.team.updateMany({
      where: { groupId: Number(groupId) },
      data: { groupId: null }
    });

    await prisma.tournamentGroup.delete({
      where: { id: Number(groupId) }
    });

    res.json({ message: "Group deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete group" });
  }
});

// GET STANDINGS / POINTS TABLE
tournamentsRouter.get("/:idOrSlug/standings", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));

    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        groups: {
          include: {
            teams: {
              include: { batch: true }
            }
          }
        },
        teams: {
          include: { batch: true, group: true }
        },
        matches: {
          where: { status: "COMPLETED" },
          include: {
            teamA: true,
            teamB: true,
            cricketInnings: true,
            footballDetail: true,
          }
        }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    const rules = (tournament.rules as any) || {};
    const winPoints = rules.pointsWin !== undefined ? Number(rules.pointsWin) : (tournament.sport === "FOOTBALL" ? 3 : 2);
    const tiePoints = rules.pointsTie !== undefined ? Number(rules.pointsTie) : (rules.pointsDraw !== undefined ? Number(rules.pointsDraw) : 1);

    // Helper to calculate standings for a set of teams
    const calculateGroupStandings = (teams: any[], matches: any[]) => {
      const statsMap = new Map<number, any>();

      for (const t of teams) {
        statsMap.set(t.id, {
          teamId: t.id,
          teamName: t.name,
          shortName: t.shortName,
          batchName: t.batch ? t.batch.name : null,
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          // Cricket stats for NRR
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          nrr: 0.0,
          // Football stats
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
        });
      }

      for (const m of matches) {
        const statsA = statsMap.get(m.teamAId);
        const statsB = statsMap.get(m.teamBId);
        if (!statsA || !statsB) continue;

        statsA.played += 1;
        statsB.played += 1;

        if (m.isNoResult) {
          statsA.noResult += 1;
          statsB.noResult += 1;
          statsA.points += tiePoints;
          statsB.points += tiePoints;
        } else if (m.isTied) {
          statsA.tied += 1;
          statsB.tied += 1;
          statsA.points += tiePoints;
          statsB.points += tiePoints;
        } else if (m.winnerTeamId === m.teamAId) {
          statsA.won += 1;
          statsB.lost += 1;
          statsA.points += winPoints;
        } else if (m.winnerTeamId === m.teamBId) {
          statsB.won += 1;
          statsA.lost += 1;
          statsB.points += winPoints;
        }

        // Football Goals
        if (tournament.sport === "FOOTBALL" && m.footballDetail) {
          const gA = m.footballDetail.teamAScore || 0;
          const gB = m.footballDetail.teamBScore || 0;
          statsA.goalsFor += gA;
          statsA.goalsAgainst += gB;
          statsB.goalsFor += gB;
          statsB.goalsAgainst += gA;
        }

        // Cricket Scores for NRR
        if (tournament.sport === "CRICKET" && m.cricketInnings && m.cricketInnings.length > 0) {
          for (const inn of m.cricketInnings) {
            if (inn.battingTeamId === m.teamAId) {
              statsA.runsScored += inn.totalRuns;
              statsA.oversFaced += inn.totalOvers || 10;
              statsB.runsConceded += inn.totalRuns;
              statsB.oversBowled += inn.totalOvers || 10;
            } else if (inn.battingTeamId === m.teamBId) {
              statsB.runsScored += inn.totalRuns;
              statsB.oversFaced += inn.totalOvers || 10;
              statsA.runsConceded += inn.totalRuns;
              statsA.oversBowled += inn.totalOvers || 10;
            }
          }
        }
      }

      const list = Array.from(statsMap.values()).map(s => {
        if (tournament.sport === "FOOTBALL") {
          s.goalDifference = s.goalsFor - s.goalsAgainst;
        } else {
          const runRateFor = s.oversFaced > 0 ? (s.runsScored / s.oversFaced) : 0;
          const runRateAgainst = s.oversBowled > 0 ? (s.runsConceded / s.oversBowled) : 0;
          s.nrr = Number((runRateFor - runRateAgainst).toFixed(3));
        }
        return s;
      });

      // Sort by Points (desc), then GD/NRR (desc), then Won (desc)
      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (tournament.sport === "FOOTBALL") {
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        } else {
          return b.nrr - a.nrr;
        }
      });

      return list;
    };

    // If groups exist, group by groups
    if (tournament.groups.length > 0) {
      const groupsData = tournament.groups.map(g => {
        const groupMatches = tournament.matches.filter(m => m.groupId === g.id);
        const standings = calculateGroupStandings(g.teams, groupMatches);
        return {
          groupId: g.id,
          groupName: g.name,
          standings,
        };
      });

      // Also unallocated teams if any
      const unallocatedTeams = tournament.teams.filter(t => !t.groupId);
      if (unallocatedTeams.length > 0) {
        groupsData.push({
          groupId: 0,
          groupName: "General Pool",
          standings: calculateGroupStandings(unallocatedTeams, tournament.matches.filter(m => !m.groupId)),
        });
      }

      res.json({ sport: tournament.sport, groups: groupsData });
    } else {
      // Single general standings table
      const standings = calculateGroupStandings(tournament.teams, tournament.matches);
      res.json({
        sport: tournament.sport,
        groups: [{
          groupId: 0,
          groupName: "Standings",
          standings,
        }]
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to compute standings" });
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

