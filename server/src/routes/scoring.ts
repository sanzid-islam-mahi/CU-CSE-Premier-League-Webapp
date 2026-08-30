import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { z } from "zod";
import { advanceTournamentKnockouts } from "../lib/knockoutProgression.js";

export const scoringRouter = Router();

// Helper to verify scorer, organizer, or admin permission
export async function canScoreMatch(userId: number, role: string, matchId: number): Promise<boolean> {
  if (role === "ADMIN") return true;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true }
  });

  if (!match) return false;

  // Check if assigned scorer
  const isAssignedScorer = await prisma.matchScorer.findUnique({
    where: { matchId_userId: { matchId, userId } }
  });
  if (isAssignedScorer) return true;

  // Check if tournament organizer
  const isOrganizer = await prisma.tournamentOrganizer.findUnique({
    where: { tournamentId_userId: { tournamentId: match.tournamentId, userId } }
  });
  return !!isOrganizer;
}

// 1. GET FULL LIVE MATCH DATA
scoringRouter.get("/:id/live", async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            slug: true,
            sport: true,
            rules: true,
          }
        },
        group: { select: { id: true, name: true } },
        teamA: {
          include: {
            batch: true,
            members: { include: { user: true } }
          }
        },
        teamB: {
          include: {
            batch: true,
            members: { include: { user: true } }
          }
        },
        winnerTeam: { select: { id: true, name: true, shortName: true } },
        playerOfTheMatch: { select: { id: true, name: true, studentId: true } },
        scorers: { include: { user: { select: { id: true, name: true, studentId: true } } } },
        matchSquads: { include: { user: { select: { id: true, name: true, studentId: true } } } },
        cricketInnings: {
          include: {
            battingScorecards: { 
              include: { player: { select: { id: true, name: true, studentId: true } } },
              orderBy: { battingOrder: "asc" }
            },
            bowlingScorecards: { 
              include: { player: { select: { id: true, name: true, studentId: true } } },
              orderBy: { bowlingOrder: "asc" }
            },
            balls: {
              include: {
                bowler: { select: { id: true, name: true } },
                striker: { select: { id: true, name: true } },
                playerOut: { select: { id: true, name: true } },
                fielder: { select: { id: true, name: true } },
              },
              orderBy: { id: "asc" }
            }
          },
          orderBy: { inningsNumber: "asc" }
        },
        footballDetail: true,
        footballEvents: {
          include: {
            primaryPlayer: { select: { id: true, name: true, studentId: true } },
            secondaryPlayer: { select: { id: true, name: true, studentId: true } },
          },
          orderBy: { minute: "asc" }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    let isScorer = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = (req as any).user;
        if (decoded) {
          isScorer = await canScoreMatch(decoded.id, decoded.role, match.id);
        }
      } catch (_) {}
    }

    res.json({ match, isScorer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch live match" });
  }
});

// 2. MATCH SETUP (TOSS & PLAYING XI LINEUPS)
scoringRouter.post("/:id/setup", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied. Only assigned scorers or organizers can configure match setup." });
      return;
    }

    const { tossWinnerTeamId, tossDecision, teamAPlayerIds, teamBPlayerIds } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    // Base Starting XI and Toss cannot be modified after match starts
    if (match.status !== "SCHEDULED" && match.status !== "TOSS") {
      res.status(400).json({ error: "Base lineup and toss are locked because the match has already started or completed. Use substitutions to adjust active players on the pitch." });
      return;
    }

    // Update Match toss details
    await prisma.match.update({
      where: { id: matchId },
      data: {
        tossWinnerTeamId: tossWinnerTeamId ? Number(tossWinnerTeamId) : undefined,
        tossDecision: tossDecision || undefined,
        status: match.status === "SCHEDULED" ? "TOSS" : match.status,
      }
    });

    // Clear old squads if resetting
    await prisma.matchSquad.deleteMany({ where: { matchId } });

    // Fetch all members of Team A and Team B
    const matchWithTeams = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: { include: { members: true } },
        teamB: { include: { members: true } }
      }
    });

    if (matchWithTeams) {
      const selectedASet = new Set((teamAPlayerIds || []).map(Number));
      const selectedBSet = new Set((teamBPlayerIds || []).map(Number));

      const squadData = [
        ...matchWithTeams.teamA.members.map((m, idx) => ({
          matchId,
          teamId: matchWithTeams.teamAId,
          userId: m.userId,
          isPlayingXI: selectedASet.has(m.userId),
          battingOrder: idx + 1,
        })),
        ...matchWithTeams.teamB.members.map((m, idx) => ({
          matchId,
          teamId: matchWithTeams.teamBId,
          userId: m.userId,
          isPlayingXI: selectedBSet.has(m.userId),
          battingOrder: idx + 1,
        }))
      ];

      if (squadData.length > 0) {
        await prisma.matchSquad.createMany({ data: squadData });
      }
    }

    res.json({ message: "Toss and lineups configured successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to setup match" });
  }
});

// 3. CRICKET: START INNINGS
scoringRouter.post("/:id/cricket/start-innings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { inningsNumber, battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId } = req.body;

    // Check if innings already exists
    let innings = await prisma.cricketInnings.findUnique({
      where: { matchId_inningsNumber: { matchId, inningsNumber: Number(inningsNumber) } }
    });

    if (!innings) {
      innings = await prisma.cricketInnings.create({
        data: {
          matchId,
          inningsNumber: Number(inningsNumber),
          battingTeamId: Number(battingTeamId),
          bowlingTeamId: Number(bowlingTeamId),
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0.0,
        }
      });
    }

    // Initialize Batting Scorecard for Striker (Order 1)
    if (strikerId) {
      await prisma.cricketBattingScorecard.upsert({
        where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(strikerId) } },
        create: { inningsId: innings.id, playerId: Number(strikerId), battingOrder: 1 },
        update: {}
      });
    }

    // Initialize Batting Scorecard for Non-Striker (Order 2)
    if (nonStrikerId) {
      await prisma.cricketBattingScorecard.upsert({
        where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(nonStrikerId) } },
        create: { inningsId: innings.id, playerId: Number(nonStrikerId), battingOrder: 2 },
        update: {}
      });
    }

    // Initialize Bowling Scorecard for Opening Bowler
    if (bowlerId) {
      await prisma.cricketBowlingScorecard.upsert({
        where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(bowlerId) } },
        create: { inningsId: innings.id, playerId: Number(bowlerId), bowlingOrder: 1 },
        update: {}
      });
    }

    // Transition match status to LIVE
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "LIVE" }
    });

    res.json({ message: `Innings #${inningsNumber} started!`, innings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to start innings" });
  }
});

// 4. CRICKET: RECORD BALL DELIVERY
scoringRouter.post("/:id/cricket/ball", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const {
      inningsId,
      strikerId,
      nonStrikerId,
      bowlerId,
      runsBat = 0,
      extraType = "NONE",
      extraRuns = 0,
      isWicket = false,
      wicketType = null,
      playerOutId = null,
      fielderId = null,
      newBatterId = null,
      commentary = null,
    } = req.body;

    const innings = await prisma.cricketInnings.findUnique({
      where: { id: Number(inningsId) },
      include: {
        balls: true,
        match: { select: { id: true, tournament: { select: { sport: true, rules: true } } } }
      }
    });

    if (!innings) {
      res.status(404).json({ error: "Innings not found" });
      return;
    }

    const isLegalBall = extraType !== "WIDE" && extraType !== "NO_BALL";
    const legalBalls = innings.balls.filter(b => b.extraType !== "WIDE" && b.extraType !== "NO_BALL");
    const currentLegalCount = legalBalls.length;
    const overNumber = Math.floor(currentLegalCount / 6);
    const ballNumber = isLegalBall ? (currentLegalCount % 6) + 1 : ((currentLegalCount % 6) || 1);

    // 1. Create Ball Record
    const createdBall = await prisma.cricketBall.create({
      data: {
        inningsId: innings.id,
        overNumber,
        ballNumber,
        bowlerId: Number(bowlerId),
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        runsBat: Number(runsBat),
        extraType: extraType || "NONE",
        extraRuns: Number(extraRuns),
        isWicket: Boolean(isWicket),
        wicketType: wicketType || null,
        playerOutId: playerOutId ? Number(playerOutId) : null,
        fielderId: fielderId ? Number(fielderId) : null,
        commentary: commentary || null,
      }
    });

    // 2. Update Innings Totals
    const totalExtraRunsToAdd = extraType === "WIDE" || extraType === "NO_BALL"
      ? (1 + Number(extraRuns))
      : Number(extraRuns);
    const totalDeliveryRuns = Number(runsBat) + totalExtraRunsToAdd;
    
    const newLegalCount = isLegalBall ? currentLegalCount + 1 : currentLegalCount;
    const newTotalOvers = Math.floor(newLegalCount / 6) + (newLegalCount % 6) / 10;

    await prisma.cricketInnings.update({
      where: { id: innings.id },
      data: {
        totalRuns: { increment: totalDeliveryRuns },
        totalWickets: isWicket ? { increment: 1 } : undefined,
        totalOvers: newTotalOvers,
        wides: extraType === "WIDE" ? { increment: 1 + Number(extraRuns) } : undefined,
        noBalls: extraType === "NO_BALL" ? { increment: 1 + Number(extraRuns) } : undefined,
        byes: extraType === "BYE" ? { increment: Number(extraRuns) } : undefined,
        legByes: extraType === "LEG_BYE" ? { increment: Number(extraRuns) } : undefined,
        penaltyRuns: extraType === "PENALTY" ? { increment: Number(extraRuns) } : undefined,
      }
    });

    // 3. Update Striker's Batting Scorecard
    const bowlerUser = await prisma.user.findUnique({ where: { id: Number(bowlerId) }, select: { name: true } });
    const fielderUser = fielderId ? await prisma.user.findUnique({ where: { id: Number(fielderId) }, select: { name: true } }) : null;

    const isStrikerOut = isWicket && (playerOutId === strikerId || !playerOutId);

    await prisma.cricketBattingScorecard.upsert({
      where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(strikerId) } },
      create: {
        inningsId: innings.id,
        playerId: Number(strikerId),
        runs: Number(runsBat),
        balls: extraType === "WIDE" ? 0 : 1,
        fours: Number(runsBat) === 4 ? 1 : 0,
        sixes: Number(runsBat) === 6 ? 1 : 0,
        isOut: isStrikerOut,
        wicketType: isStrikerOut ? wicketType : null,
        bowlerName: isStrikerOut && wicketType !== "RUN_OUT" ? bowlerUser?.name : null,
        fielderName: isStrikerOut ? fielderUser?.name : null,
      },
      update: {
        runs: { increment: Number(runsBat) },
        balls: extraType === "WIDE" ? undefined : { increment: 1 },
        fours: Number(runsBat) === 4 ? { increment: 1 } : undefined,
        sixes: Number(runsBat) === 6 ? { increment: 1 } : undefined,
        isOut: isStrikerOut ? true : undefined,
        wicketType: isStrikerOut ? wicketType : undefined,
        bowlerName: isStrikerOut && wicketType !== "RUN_OUT" ? bowlerUser?.name : undefined,
        fielderName: isStrikerOut ? fielderUser?.name : undefined,
      }
    });

    // If Non-Striker was run out
    if (isWicket && playerOutId === nonStrikerId) {
      await prisma.cricketBattingScorecard.update({
        where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(nonStrikerId) } },
        data: {
          isOut: true,
          wicketType: wicketType || "RUN_OUT",
          fielderName: fielderUser?.name || null,
        }
      });
    }

    // 4. Update Bowler's Scorecard
    const bowlerCharge = Number(runsBat) + (extraType === "WIDE" || extraType === "NO_BALL" ? (1 + Number(extraRuns)) : 0);
    const isBowlerWicket = isWicket && wicketType !== "RUN_OUT" && wicketType !== "RETIRED_HURT" && wicketType !== "OBSTRUCTING" && wicketType !== "TIMED_OUT";

    // Recalculate bowler legal overs
    const allBowlerBalls = await prisma.cricketBall.findMany({
      where: { inningsId: innings.id, bowlerId: Number(bowlerId) }
    });
    const bowlerLegalCount = allBowlerBalls.filter(b => b.extraType !== "WIDE" && b.extraType !== "NO_BALL").length;
    const bowlerOvers = Math.floor(bowlerLegalCount / 6) + (bowlerLegalCount % 6) / 10;

    await prisma.cricketBowlingScorecard.upsert({
      where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(bowlerId) } },
      create: {
        inningsId: innings.id,
        playerId: Number(bowlerId),
        runs: bowlerCharge,
        wickets: isBowlerWicket ? 1 : 0,
        wides: extraType === "WIDE" ? 1 + Number(extraRuns) : 0,
        noBalls: extraType === "NO_BALL" ? 1 + Number(extraRuns) : 0,
        overs: bowlerOvers,
      },
      update: {
        runs: { increment: bowlerCharge },
        wickets: isBowlerWicket ? { increment: 1 } : undefined,
        wides: extraType === "WIDE" ? { increment: 1 + Number(extraRuns) } : undefined,
        noBalls: extraType === "NO_BALL" ? { increment: 1 + Number(extraRuns) } : undefined,
        overs: bowlerOvers,
      }
    });

    // 5. If new batter came in, register their batting scorecard
    if (newBatterId) {
      const existingScorecardCount = await prisma.cricketBattingScorecard.count({ where: { inningsId: innings.id } });
      await prisma.cricketBattingScorecard.upsert({
        where: { inningsId_playerId: { inningsId: innings.id, playerId: Number(newBatterId) } },
        create: {
          inningsId: innings.id,
          playerId: Number(newBatterId),
          battingOrder: existingScorecardCount + 1
        },
        update: {}
      });
    }

    // 6. Compute Next Striker & Non-Striker
    let nextStriker = strikerId;
    let nextNonStriker = nonStrikerId;

    if (isWicket) {
      if (playerOutId === strikerId || !playerOutId) {
        nextStriker = newBatterId || null;
      } else {
        nextNonStriker = newBatterId || null;
      }
    }

    // Odd runs rotate strike
    if (Number(runsBat) % 2 === 1) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
    }

    // End of over rotates strike
    const isOverEnd = isLegalBall && (newLegalCount % 6 === 0);
    if (isOverEnd) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
    }

    res.json({
      message: "Ball recorded.",
      ball: createdBall,
      nextStrikerId: nextStriker,
      nextNonStrikerId: nextNonStriker,
      isOverEnd,
      overNumber: Math.floor(newLegalCount / 6),
      ballInOver: newLegalCount % 6,
      isFreeHitNext: extraType === "NO_BALL",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to record ball delivery" });
  }
});

// 5. CRICKET: UNDO LAST BALL
scoringRouter.post("/:id/cricket/undo", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { inningsId } = req.body;
    const lastBall = await prisma.cricketBall.findFirst({
      where: { inningsId: Number(inningsId) },
      orderBy: { id: "desc" }
    });

    if (!lastBall) {
      res.status(400).json({ error: "No balls to undo in this innings." });
      return;
    }

    // Delete the last ball
    await prisma.cricketBall.delete({ where: { id: lastBall.id } });

    // Recalculate everything for this innings from remaining balls
    const remainingBalls = await prisma.cricketBall.findMany({
      where: { inningsId: Number(inningsId) },
      orderBy: { id: "asc" }
    });

    let totalRuns = 0;
    let totalWickets = 0;
    let legalBalls = 0;
    let wides = 0;
    let noBalls = 0;
    let byes = 0;
    let legByes = 0;
    let penalty = 0;

    const batterMap = new Map<number, any>();
    const bowlerMap = new Map<number, any>();

    for (const b of remainingBalls) {
      const isLegal = b.extraType !== "WIDE" && b.extraType !== "NO_BALL";
      if (isLegal) legalBalls++;
      
      const extraToAdd = b.extraType === "WIDE" || b.extraType === "NO_BALL" ? (1 + b.extraRuns) : b.extraRuns;
      totalRuns += (b.runsBat + extraToAdd);
      if (b.isWicket) totalWickets++;

      if (b.extraType === "WIDE") wides += (1 + b.extraRuns);
      if (b.extraType === "NO_BALL") noBalls += (1 + b.extraRuns);
      if (b.extraType === "BYE") byes += b.extraRuns;
      if (b.extraType === "LEG_BYE") legByes += b.extraRuns;
      if (b.extraType === "PENALTY") penalty += b.extraRuns;

      // Batter stats
      if (!batterMap.has(b.strikerId)) {
        batterMap.set(b.strikerId, { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false });
      }
      const bStat = batterMap.get(b.strikerId);
      bStat.runs += b.runsBat;
      if (b.extraType !== "WIDE") bStat.balls++;
      if (b.runsBat === 4) bStat.fours++;
      if (b.runsBat === 6) bStat.sixes++;

      if (b.isWicket && b.playerOutId) {
        if (!batterMap.has(b.playerOutId)) {
          batterMap.set(b.playerOutId, { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: true });
        } else {
          batterMap.get(b.playerOutId).isOut = true;
        }
      }

      // Bowler stats
      if (!bowlerMap.has(b.bowlerId)) {
        bowlerMap.set(b.bowlerId, { runs: 0, wickets: 0, wides: 0, noBalls: 0, legalCount: 0 });
      }
      const bwStat = bowlerMap.get(b.bowlerId);
      if (isLegal) bwStat.legalCount++;
      const bowlerCharge = b.runsBat + (b.extraType === "WIDE" || b.extraType === "NO_BALL" ? (1 + b.extraRuns) : 0);
      bwStat.runs += bowlerCharge;
      if (b.extraType === "WIDE") bwStat.wides += (1 + b.extraRuns);
      if (b.extraType === "NO_BALL") bwStat.noBalls += (1 + b.extraRuns);
      if (b.isWicket && b.wicketType !== "RUN_OUT") bwStat.wickets++;
    }

    const totalOvers = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;

    await prisma.cricketInnings.update({
      where: { id: Number(inningsId) },
      data: { totalRuns, totalWickets, totalOvers, wides, noBalls, byes, legByes, penaltyRuns: penalty }
    });

    // Sync batting scorecards
    for (const [playerId, s] of batterMap.entries()) {
      await prisma.cricketBattingScorecard.updateMany({
        where: { inningsId: Number(inningsId), playerId },
        data: { runs: s.runs, balls: s.balls, fours: s.fours, sixes: s.sixes, isOut: s.isOut }
      });
    }

    // Sync bowling scorecards
    for (const [playerId, s] of bowlerMap.entries()) {
      const bOvers = Math.floor(s.legalCount / 6) + (s.legalCount % 6) / 10;
      await prisma.cricketBowlingScorecard.updateMany({
        where: { inningsId: Number(inningsId), playerId },
        data: { runs: s.runs, wickets: s.wickets, wides: s.wides, noBalls: s.noBalls, overs: bOvers }
      });
    }

    res.json({ message: "Last delivery undone successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to undo ball" });
  }
});

// 6. FOOTBALL: UPDATE TIMER & PERIOD
scoringRouter.post("/:id/football/timer", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { clockSeconds, isClockRunning, currentHalf, status } = req.body;

    const detail = await prisma.footballMatchDetail.upsert({
      where: { matchId },
      create: {
        matchId,
        clockSeconds: clockSeconds !== undefined ? Number(clockSeconds) : 0,
        isClockRunning: isClockRunning !== undefined ? Boolean(isClockRunning) : false,
        currentHalf: currentHalf !== undefined ? Number(currentHalf) : 1,
      },
      update: {
        clockSeconds: clockSeconds !== undefined ? Number(clockSeconds) : undefined,
        isClockRunning: isClockRunning !== undefined ? Boolean(isClockRunning) : undefined,
        currentHalf: currentHalf !== undefined ? Number(currentHalf) : undefined,
      }
    });

    if (status) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status }
      });

      // If match is starting LIVE and no squads exist yet, auto-seed default starting XI (first 11 of each team)
      if (status === "LIVE") {
        const existingSquadsCount = await prisma.matchSquad.count({ where: { matchId } });
        if (existingSquadsCount === 0) {
          const matchWithTeams = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
              teamA: { include: { members: true } },
              teamB: { include: { members: true } }
            }
          });

          if (matchWithTeams) {
            const squadData = [
              ...matchWithTeams.teamA.members.map((m, idx) => ({
                matchId,
                teamId: matchWithTeams.teamAId,
                userId: m.userId,
                isPlayingXI: idx < 11,
                battingOrder: idx + 1,
              })),
              ...matchWithTeams.teamB.members.map((m, idx) => ({
                matchId,
                teamId: matchWithTeams.teamBId,
                userId: m.userId,
                isPlayingXI: idx < 11,
                battingOrder: idx + 1,
              }))
            ];

            if (squadData.length > 0) {
              await prisma.matchSquad.createMany({ data: squadData });
            }
          }
        }
      }
    }

    res.json({ message: "Timer state updated.", detail });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update timer" });
  }
});

// 7. FOOTBALL: LOG MATCH EVENT (GOAL, CARD, SUB)
scoringRouter.post("/:id/football/events", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { teamId, minute, stoppageMinute, eventType, primaryPlayerId, secondaryPlayerId, description, currentClockSeconds } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { footballDetail: true }
    });

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    // Keep footballDetail clock in sync if client sent currentClockSeconds
    if (currentClockSeconds !== undefined && match.footballDetail) {
      await prisma.footballMatchDetail.update({
        where: { matchId },
        data: { clockSeconds: Number(currentClockSeconds) }
      });
    }

    // Auto-generate description for substitutions if not supplied
    let finalDescription = description || null;
    if (eventType === "SUBSTITUTION" && primaryPlayerId && secondaryPlayerId) {
      // Validate that neither player has been sent off with a red card
      const existingEvents = await prisma.footballMatchEvent.findMany({ where: { matchId } });
      const redCarded = new Set<number>();
      const yellowCount = new Map<number, number>();
      existingEvents.forEach(ev => {
        if (ev.eventType === "RED_CARD") redCarded.add(ev.primaryPlayerId);
        else if (ev.eventType === "YELLOW_CARD") {
          const c = (yellowCount.get(ev.primaryPlayerId) || 0) + 1;
          yellowCount.set(ev.primaryPlayerId, c);
          if (c >= 2) redCarded.add(ev.primaryPlayerId);
        }
      });

      if (redCarded.has(Number(secondaryPlayerId))) {
        res.status(400).json({ error: "Cannot substitute a player who has received a red card (sent off)." });
        return;
      }
      if (redCarded.has(Number(primaryPlayerId))) {
        res.status(400).json({ error: "Cannot substitute in a player who has already been sent off." });
        return;
      }

      const pIn = await prisma.user.findUnique({ where: { id: Number(primaryPlayerId) }, select: { name: true } });
      const pOut = await prisma.user.findUnique({ where: { id: Number(secondaryPlayerId) }, select: { name: true } });
      finalDescription = finalDescription || `Sub: ${pIn?.name || "Player In"} ON, ${pOut?.name || "Player Out"} OFF`;

      // Update MatchSquad on-pitch status
      // Sub Out -> isPlayingXI = false
      await prisma.matchSquad.updateMany({
        where: { matchId, userId: Number(secondaryPlayerId) },
        data: { isPlayingXI: false }
      });

      // Sub In -> isPlayingXI = true (upsert if exists)
      const existingInSquad = await prisma.matchSquad.findUnique({
        where: { matchId_teamId_userId: { matchId, teamId: Number(teamId), userId: Number(primaryPlayerId) } }
      });

      if (existingInSquad) {
        await prisma.matchSquad.update({
          where: { id: existingInSquad.id },
          data: { isPlayingXI: true }
        });
      } else {
        await prisma.matchSquad.create({
          data: {
            matchId,
            teamId: Number(teamId),
            userId: Number(primaryPlayerId),
            isPlayingXI: true,
          }
        });
      }
    } else if (eventType === "RED_CARD" && primaryPlayerId) {
      // Player sent off -> mark isPlayingXI = false
      await prisma.matchSquad.updateMany({
        where: { matchId, userId: Number(primaryPlayerId) },
        data: { isPlayingXI: false }
      });
    } else if ((eventType === "GOAL" || eventType === "PENALTY_GOAL" || eventType === "OWN_GOAL") && !finalDescription) {
      if (secondaryPlayerId) {
        const assistUser = await prisma.user.findUnique({ where: { id: Number(secondaryPlayerId) }, select: { name: true } });
        if (assistUser?.name) {
          finalDescription = `Assist: ${assistUser.name}`;
        }
      }
    }

    const createdEvent = await prisma.footballMatchEvent.create({
      data: {
        matchId,
        teamId: Number(teamId),
        minute: Number(minute) || 0,
        stoppageMinute: stoppageMinute ? Number(stoppageMinute) : null,
        eventType,
        primaryPlayerId: Number(primaryPlayerId),
        secondaryPlayerId: secondaryPlayerId ? Number(secondaryPlayerId) : null,
        description: finalDescription,
      },
      include: {
        primaryPlayer: { select: { id: true, name: true, studentId: true } },
        secondaryPlayer: { select: { id: true, name: true, studentId: true } },
      }
    });

    // If Goal or Penalty Goal, increment score for that team
    // If Own Goal, increment score for opposing team
    if (eventType === "GOAL" || eventType === "PENALTY_GOAL") {
      if (Number(teamId) === match.teamAId) {
        await prisma.footballMatchDetail.update({
          where: { matchId },
          data: { teamAScore: { increment: 1 } }
        });
      } else {
        await prisma.footballMatchDetail.update({
          where: { matchId },
          data: { teamBScore: { increment: 1 } }
        });
      }
    } else if (eventType === "OWN_GOAL") {
      if (Number(teamId) === match.teamAId) {
        await prisma.footballMatchDetail.update({
          where: { matchId },
          data: { teamBScore: { increment: 1 } }
        });
      } else {
        await prisma.footballMatchDetail.update({
          where: { matchId },
          data: { teamAScore: { increment: 1 } }
        });
      }
    }

    res.status(201).json({ message: "Event logged successfully.", event: createdEvent });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to log event" });
  }
});

// 8. FOOTBALL: RECORD PENALTY SHOOTOUT (FOR TIED KNOCKOUT MATCHES)
scoringRouter.post("/:id/football/penalty-shootout", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { teamAPenaltyScore, teamBPenaltyScore, shootoutWinnerTeamId, playerOfTheMatchId } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { teamA: true, teamB: true, footballDetail: true }
    });

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    // Update football details with penalty scores
    await prisma.footballMatchDetail.upsert({
      where: { matchId },
      create: {
        matchId,
        teamAPenaltyScore: Number(teamAPenaltyScore),
        teamBPenaltyScore: Number(teamBPenaltyScore),
        isClockRunning: false,
      },
      update: {
        teamAPenaltyScore: Number(teamAPenaltyScore),
        teamBPenaltyScore: Number(teamBPenaltyScore),
        isClockRunning: false,
      }
    });

    const winner = Number(shootoutWinnerTeamId) === match.teamAId ? match.teamA : match.teamB;
    const regularA = match.footballDetail?.teamAScore || 0;
    const regularB = match.footballDetail?.teamBScore || 0;
    const resultSummary = `${winner.name} won on penalties (${teamAPenaltyScore}-${teamBPenaltyScore}) after ${regularA}-${regularB} draw`;

    // Complete the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        winnerTeamId: Number(shootoutWinnerTeamId),
        resultSummary,
        isTied: false,
        playerOfTheMatchId: playerOfTheMatchId ? Number(playerOfTheMatchId) : null,
      }
    });

    // Auto-advance tournament knockouts (Group Stage -> Semi Finals, Semi Finals -> Final, Final -> Crown Victor)
    await advanceTournamentKnockouts(prisma, matchId);

    res.json({ message: "Penalty shootout recorded & match completed.", match: updatedMatch, resultSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to record penalty shootout" });
  }
});

// 8. FOOTBALL: DELETE EVENT
scoringRouter.delete("/:id/football/events/:eventId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const eventId = Number(req.params.eventId);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const event = await prisma.footballMatchEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    await prisma.footballMatchEvent.delete({ where: { id: eventId } });

    // Recalculate score
    const allEvents = await prisma.footballMatchEvent.findMany({ where: { matchId } });
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (match) {
      let teamAScore = 0;
      let teamBScore = 0;
      for (const ev of allEvents) {
        if (ev.eventType === "GOAL" || ev.eventType === "PENALTY_GOAL") {
          if (ev.teamId === match.teamAId) teamAScore++;
          else teamBScore++;
        } else if (ev.eventType === "OWN_GOAL") {
          if (ev.teamId === match.teamAId) teamBScore++;
          else teamAScore++;
        }
      }
      await prisma.footballMatchDetail.update({
        where: { matchId },
        data: { teamAScore, teamBScore }
      });
    }

    res.json({ message: "Event deleted." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete event" });
  }
});

// 9. COMPLETE MATCH (AND CASCADE WINNERS TO GRAND FINAL IF SF)
scoringRouter.post("/:id/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = Number(req.params.id);
    const allowed = await canScoreMatch(req.user!.id, req.user!.role, matchId);
    if (!allowed) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { winnerTeamId, resultSummary, isTied = false, isNoResult = false, playerOfTheMatchId = null } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        winnerTeamId: winnerTeamId ? Number(winnerTeamId) : null,
        resultSummary: resultSummary || null,
        isTied: Boolean(isTied),
        isNoResult: Boolean(isNoResult),
        playerOfTheMatchId: playerOfTheMatchId ? Number(playerOfTheMatchId) : null,
      }
    });

    // Auto-advance tournament knockouts (Group Stage -> Semi Finals, Semi Finals -> Final, Final -> Crown Victor)
    await advanceTournamentKnockouts(prisma, matchId);

    res.json({ message: "Match completed and result sealed!", match: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to complete match" });
  }
});

// 10. TOURNAMENT STATS & LEADERBOARDS (ORANGE CAP, PURPLE CAP, GOLDEN BOOT)
scoringRouter.get("/tournament/:idOrSlug/stats", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNum = !isNaN(Number(idOrSlug));
    const tournament = await prisma.tournament.findFirst({
      where: isNum ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        teams: { include: { batch: true } },
        matches: {
          include: {
            cricketInnings: {
              include: {
                battingScorecards: { include: { player: { include: { batch: true } } } },
                bowlingScorecards: { include: { player: { include: { batch: true } } } },
              }
            },
            footballEvents: {
              include: {
                primaryPlayer: { include: { batch: true } },
                secondaryPlayer: { include: { batch: true } },
              }
            },
            footballDetail: true,
          }
        }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    if (tournament.sport === "CRICKET") {
      // Aggregate Batting Stats
      const battingMap = new Map<number, any>();
      const bowlingMap = new Map<number, any>();

      for (const m of tournament.matches) {
        for (const inn of m.cricketInnings) {
          for (const bat of inn.battingScorecards) {
            if (!battingMap.has(bat.playerId)) {
              battingMap.set(bat.playerId, {
                player: bat.player,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                innings: 0,
                highestScore: 0,
                fifties: 0,
                hundreds: 0,
                outs: 0,
              });
            }
            const stat = battingMap.get(bat.playerId);
            stat.innings += 1;
            stat.runs += bat.runs;
            stat.balls += bat.balls;
            stat.fours += bat.fours;
            stat.sixes += bat.sixes;
            if (bat.runs > stat.highestScore) stat.highestScore = bat.runs;
            if (bat.runs >= 100) stat.hundreds += 1;
            else if (bat.runs >= 50) stat.fifties += 1;
            if (bat.isOut) stat.outs += 1;
          }

          for (const bowl of inn.bowlingScorecards) {
            if (!bowlingMap.has(bowl.playerId)) {
              bowlingMap.set(bowl.playerId, {
                player: bowl.player,
                overs: 0.0,
                maidens: 0,
                runs: 0,
                wickets: 0,
                wides: 0,
                noBalls: 0,
                innings: 0,
                bestWickets: 0,
                bestRuns: 999,
              });
            }
            const stat = bowlingMap.get(bowl.playerId);
            stat.innings += 1;
            stat.overs += bowl.overs;
            stat.maidens += bowl.maidens;
            stat.runs += bowl.runs;
            stat.wickets += bowl.wickets;
            stat.wides += bowl.wides;
            stat.noBalls += bowl.noBalls;
            if (bowl.wickets > stat.bestWickets || (bowl.wickets === stat.bestWickets && bowl.runs < stat.bestRuns)) {
              stat.bestWickets = bowl.wickets;
              stat.bestRuns = bowl.runs;
            }
          }
        }
      }

      const topBatters = Array.from(battingMap.values())
        .map(b => ({
          ...b,
          average: b.outs > 0 ? (b.runs / b.outs).toFixed(2) : b.runs.toFixed(2),
          strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : "0.00",
        }))
        .sort((a, b) => b.runs - a.runs || Number(b.strikeRate) - Number(a.strikeRate));

      const topBowlers = Array.from(bowlingMap.values())
        .map(b => ({
          ...b,
          economy: b.overs > 0 ? (b.runs / Math.max(1, Math.floor(b.overs) + (b.overs % 1) * (10 / 6))).toFixed(2) : "0.00",
          bestFigures: b.bestWickets > 0 ? `${b.bestWickets}/${b.bestRuns}` : "-",
        }))
        .sort((a, b) => b.wickets - a.wickets || Number(a.economy) - Number(b.economy));

      const boundaryKings = Array.from(battingMap.values())
        .sort((a, b) => (b.sixes * 6 + b.fours * 4) - (a.sixes * 6 + a.fours * 4));

      res.json({
        sport: "CRICKET",
        orangeCap: topBatters.slice(0, 10),
        purpleCap: topBowlers.slice(0, 10),
        boundaryKings: boundaryKings.slice(0, 10),
      });
    } else {
      // Football Leaderboards
      const goalScorersMap = new Map<number, any>();
      const assistMap = new Map<number, any>();

      for (const m of tournament.matches) {
        for (const ev of m.footballEvents) {
          if (ev.eventType === "GOAL" || ev.eventType === "PENALTY_GOAL") {
            if (!goalScorersMap.has(ev.primaryPlayerId)) {
              goalScorersMap.set(ev.primaryPlayerId, { player: ev.primaryPlayer, goals: 0 });
            }
            goalScorersMap.get(ev.primaryPlayerId).goals += 1;

            if (ev.secondaryPlayerId && ev.secondaryPlayer) {
              if (!assistMap.has(ev.secondaryPlayerId)) {
                assistMap.set(ev.secondaryPlayerId, { player: ev.secondaryPlayer, assists: 0 });
              }
              assistMap.get(ev.secondaryPlayerId).assists += 1;
            }
          }
        }
      }

      const goldenBoot = Array.from(goalScorersMap.values()).sort((a, b) => b.goals - a.goals);
      const topPlaymakers = Array.from(assistMap.values()).sort((a, b) => b.assists - a.assists);

      res.json({
        sport: "FOOTBALL",
        goldenBoot: goldenBoot.slice(0, 10),
        topPlaymakers: topPlaymakers.slice(0, 10),
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tournament stats" });
  }
});

// 11. OVERALL / DEPARTMENT-WIDE LEADERBOARD STATS
scoringRouter.get("/stats/overall", async (req, res) => {
  try {
    const { sport, tournamentId } = req.query;

    const tournamentWhere: any = {};
    if (tournamentId) {
      tournamentWhere.id = Number(tournamentId);
    }
    if (sport) {
      tournamentWhere.sport = String(sport).toUpperCase() as "CRICKET" | "FOOTBALL";
    }

    const tournaments = await prisma.tournament.findMany({
      where: tournamentWhere,
      include: {
        teams: {
          include: {
            batch: true,
            members: {
              include: { user: { include: { batch: true } } }
            }
          }
        },
        matches: {
          include: {
            teamA: { include: { batch: true, members: { include: { user: true } } } },
            teamB: { include: { batch: true, members: { include: { user: true } } } },
            cricketInnings: {
              include: {
                battingScorecards: { include: { player: { include: { batch: true } } } },
                bowlingScorecards: { include: { player: { include: { batch: true } } } },
              }
            },
            footballEvents: {
              include: {
                primaryPlayer: { include: { batch: true } },
                secondaryPlayer: { include: { batch: true } },
              }
            },
            footballDetail: true,
          }
        }
      }
    });

    // 1. Cricket Aggregations
    const battingMap = new Map<number, any>();
    const bowlingMap = new Map<number, any>();

    // 2. Football Aggregations
    const goalScorersMap = new Map<number, any>();
    const assistMap = new Map<number, any>();
    const cleanSheetsMap = new Map<number, any>();

    for (const t of tournaments) {
      if (t.sport === "CRICKET") {
        for (const m of t.matches) {
          for (const inn of m.cricketInnings) {
            for (const bat of inn.battingScorecards) {
              if (!battingMap.has(bat.playerId)) {
                battingMap.set(bat.playerId, {
                  player: bat.player,
                  runs: 0,
                  balls: 0,
                  fours: 0,
                  sixes: 0,
                  innings: 0,
                  highestScore: 0,
                  fifties: 0,
                  hundreds: 0,
                  outs: 0,
                });
              }
              const stat = battingMap.get(bat.playerId);
              stat.innings += 1;
              stat.runs += bat.runs;
              stat.balls += bat.balls;
              stat.fours += bat.fours;
              stat.sixes += bat.sixes;
              if (bat.runs > stat.highestScore) stat.highestScore = bat.runs;
              if (bat.runs >= 100) stat.hundreds += 1;
              else if (bat.runs >= 50) stat.fifties += 1;
              if (bat.isOut) stat.outs += 1;
            }

            for (const bowl of inn.bowlingScorecards) {
              if (!bowlingMap.has(bowl.playerId)) {
                bowlingMap.set(bowl.playerId, {
                  player: bowl.player,
                  overs: 0.0,
                  maidens: 0,
                  runs: 0,
                  wickets: 0,
                  wides: 0,
                  noBalls: 0,
                  innings: 0,
                  bestWickets: 0,
                  bestRuns: 999,
                });
              }
              const stat = bowlingMap.get(bowl.playerId);
              stat.innings += 1;
              stat.overs += bowl.overs;
              stat.maidens += bowl.maidens;
              stat.runs += bowl.runs;
              stat.wickets += bowl.wickets;
              stat.wides += bowl.wides;
              stat.noBalls += bowl.noBalls;
              if (bowl.wickets > stat.bestWickets || (bowl.wickets === stat.bestWickets && bowl.runs < stat.bestRuns)) {
                stat.bestWickets = bowl.wickets;
                stat.bestRuns = bowl.runs;
              }
            }
          }
        }
      } else if (t.sport === "FOOTBALL") {
        for (const m of t.matches) {
          for (const ev of m.footballEvents) {
            if (ev.eventType === "GOAL" || ev.eventType === "PENALTY_GOAL") {
              if (!goalScorersMap.has(ev.primaryPlayerId)) {
                goalScorersMap.set(ev.primaryPlayerId, { player: ev.primaryPlayer, goals: 0, matches: 0 });
              }
              goalScorersMap.get(ev.primaryPlayerId).goals += 1;

              if (ev.secondaryPlayerId && ev.secondaryPlayer) {
                if (!assistMap.has(ev.secondaryPlayerId)) {
                  assistMap.set(ev.secondaryPlayerId, { player: ev.secondaryPlayer, assists: 0 });
                }
                assistMap.get(ev.secondaryPlayerId).assists += 1;
              }
            }
          }

          // Clean sheets calculation for completed football matches
          if (m.status === "COMPLETED" && m.footballDetail) {
            if (m.footballDetail.teamBScore === 0 && m.teamA?.members) {
              const gk = m.teamA.members.find(mem => mem.user);
              if (gk) {
                if (!cleanSheetsMap.has(gk.userId)) {
                  cleanSheetsMap.set(gk.userId, { player: gk.user, cleanSheets: 0, matches: 0 });
                }
                cleanSheetsMap.get(gk.userId).cleanSheets += 1;
              }
            }
            if (m.footballDetail.teamAScore === 0 && m.teamB?.members) {
              const gk = m.teamB.members.find(mem => mem.user);
              if (gk) {
                if (!cleanSheetsMap.has(gk.userId)) {
                  cleanSheetsMap.set(gk.userId, { player: gk.user, cleanSheets: 0, matches: 0 });
                }
                cleanSheetsMap.get(gk.userId).cleanSheets += 1;
              }
            }
          }
        }
      }
    }

    // Cricket processed arrays
    const orangeCap = Array.from(battingMap.values())
      .map(b => ({
        ...b,
        average: b.outs > 0 ? (b.runs / b.outs).toFixed(2) : b.runs.toFixed(2),
        strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.runs - a.runs || Number(b.strikeRate) - Number(a.strikeRate));

    const purpleCap = Array.from(bowlingMap.values())
      .map(b => ({
        ...b,
        economy: b.overs > 0 ? (b.runs / Math.max(1, Math.floor(b.overs) + (b.overs % 1) * (10 / 6))).toFixed(2) : "0.00",
        bestFigures: b.bestWickets > 0 ? `${b.bestWickets}/${b.bestRuns}` : "-",
      }))
      .sort((a, b) => b.wickets - a.wickets || Number(a.economy) - Number(b.economy));

    const maxSixes = Array.from(battingMap.values())
      .filter(b => b.sixes > 0)
      .map(b => ({
        ...b,
        strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.sixes - a.sixes || (b.sixes * 6 + b.fours * 4) - (a.sixes * 6 + a.fours * 4));

    // Football processed arrays
    const goldenBoot = Array.from(goalScorersMap.values())
      .sort((a, b) => b.goals - a.goals);

    const topPlaymakers = Array.from(assistMap.values())
      .sort((a, b) => b.assists - a.assists);

    const goldenGlove = Array.from(cleanSheetsMap.values())
      .sort((a, b) => b.cleanSheets - a.cleanSheets);

    res.json({
      cricket: {
        orangeCap: orangeCap.slice(0, 10),
        purpleCap: purpleCap.slice(0, 10),
        maxSixes: maxSixes.slice(0, 10),
      },
      football: {
        goldenBoot: goldenBoot.slice(0, 10),
        topPlaymakers: topPlaymakers.slice(0, 10),
        goldenGlove: goldenGlove.slice(0, 10),
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch overall leaderboards" });
  }
});
