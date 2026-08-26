import { PrismaClient } from "@prisma/client";

/**
 * Automates tournament knockout seeding and championship progression:
 * 1. When all Group Stage matches finish: Auto-calculates standings and seeds Semi-Final 1 (A1 vs B2) and Semi-Final 2 (B1 vs A2).
 * 2. When Semi-Finals finish: Auto-places SF1 Winner (teamA) and SF2 Winner (teamB) into Grand Final.
 * 3. When Grand Final finishes: Marks tournament status as COMPLETED and officially crowns the Victor.
 */
export async function advanceTournamentKnockouts(prisma: PrismaClient, matchId: number) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            groups: {
              include: {
                teams: true
              }
            },
            teams: true,
            matches: {
              include: {
                footballDetail: true,
                cricketInnings: true,
              }
            }
          }
        }
      }
    });

    if (!match || !match.tournament) return;

    const tournament = match.tournament;
    const winPoints = (tournament.rules as any)?.pointsWin || (tournament.sport === "FOOTBALL" ? 3 : 2);
    const tiePoints = (tournament.rules as any)?.pointsTie || 1;

    // 1. STAGE: GROUP_STAGE -> Check if all group stage matches are COMPLETED
    if (match.stage === "GROUP_STAGE") {
      const groupMatches = tournament.matches.filter(m => m.stage === "GROUP_STAGE");
      const allGroupMatchesCompleted = groupMatches.length > 0 && groupMatches.every(m => m.status === "COMPLETED");

      if (allGroupMatchesCompleted) {
        // Calculate standings for a group or list of teams
        const getRankedTeams = (teamList: any[]) => {
          const statsMap = new Map<number, any>();
          for (const t of teamList) {
            statsMap.set(t.id, {
              team: t,
              points: 0,
              won: 0,
              lost: 0,
              tied: 0,
              goalDifference: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              runsScored: 0,
              oversFaced: 0,
              runsConceded: 0,
              oversBowled: 0,
              nrr: 0,
            });
          }

          for (const m of groupMatches) {
            const sA = statsMap.get(m.teamAId);
            const sB = statsMap.get(m.teamBId);
            if (!sA || !sB) continue;

            if (m.isNoResult || m.isTied) {
              sA.points += tiePoints;
              sB.points += tiePoints;
              sA.tied++;
              sB.tied++;
            } else if (m.winnerTeamId === m.teamAId) {
              sA.won++;
              sB.lost++;
              sA.points += winPoints;
            } else if (m.winnerTeamId === m.teamBId) {
              sB.won++;
              sA.lost++;
              sB.points += winPoints;
            }

            if (tournament.sport === "FOOTBALL" && m.footballDetail) {
              const gA = m.footballDetail.teamAScore || 0;
              const gB = m.footballDetail.teamBScore || 0;
              sA.goalsFor += gA;
              sA.goalsAgainst += gB;
              sB.goalsFor += gB;
              sB.goalsAgainst += gA;
            }

            if (tournament.sport === "CRICKET" && m.cricketInnings) {
              for (const inn of m.cricketInnings) {
                if (inn.battingTeamId === m.teamAId) {
                  sA.runsScored += inn.totalRuns;
                  sA.oversFaced += inn.totalOvers || 10;
                  sB.runsConceded += inn.totalRuns;
                  sB.oversBowled += inn.totalOvers || 10;
                } else if (inn.battingTeamId === m.teamBId) {
                  sB.runsScored += inn.totalRuns;
                  sB.oversFaced += inn.totalOvers || 10;
                  sA.runsConceded += inn.totalRuns;
                  sA.oversBowled += inn.totalOvers || 10;
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

          list.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (tournament.sport === "FOOTBALL") {
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
              if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            } else {
              if (b.nrr !== a.nrr) return b.nrr - a.nrr;
            }
            return b.won - a.won;
          });

          return list.map(s => s.team);
        };

        let sf1_teamAId: number | null = null;
        let sf1_teamBId: number | null = null;
        let sf2_teamAId: number | null = null;
        let sf2_teamBId: number | null = null;

        if (tournament.groups && tournament.groups.length >= 2) {
          const rankedA = getRankedTeams(tournament.groups[0].teams);
          const rankedB = getRankedTeams(tournament.groups[1].teams);

          if (rankedA.length >= 2 && rankedB.length >= 2) {
            // Standard Crossover: A1 vs B2 and B1 vs A2
            sf1_teamAId = rankedA[0].id;
            sf1_teamBId = rankedB[1].id;
            sf2_teamAId = rankedB[0].id;
            sf2_teamBId = rankedA[1].id;
          }
        } else if (tournament.teams.length >= 4) {
          const rankedAll = getRankedTeams(tournament.teams);
          sf1_teamAId = rankedAll[0].id;
          sf1_teamBId = rankedAll[3].id;
          sf2_teamAId = rankedAll[1].id;
          sf2_teamBId = rankedAll[2].id;
        }

        if (sf1_teamAId && sf1_teamBId && sf2_teamAId && sf2_teamBId) {
          const existingSFs = await prisma.match.findMany({
            where: { tournamentId: tournament.id, stage: "SEMI_FINAL" },
            orderBy: { matchNumber: "asc" }
          });
          const existingFinal = await prisma.match.findFirst({
            where: { tournamentId: tournament.id, stage: "FINAL" }
          });

          if (existingSFs.length >= 2) {
            // Update existing scheduled semi-finals with the verified qualified teams
            await prisma.match.update({
              where: { id: existingSFs[0].id },
              data: { teamAId: sf1_teamAId, teamBId: sf1_teamBId }
            });
            await prisma.match.update({
              where: { id: existingSFs[1].id },
              data: { teamAId: sf2_teamAId, teamBId: sf2_teamBId }
            });
          } else {
            // Create Semi-Finals and Final
            let maxMatchNum = 0;
            for (const m of tournament.matches) {
              if (m.matchNumber > maxMatchNum) maxMatchNum = m.matchNumber;
            }
            const defaultVenue = tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field";

            const m1 = await prisma.match.create({
              data: {
                tournamentId: tournament.id,
                stage: "SEMI_FINAL",
                matchNumber: maxMatchNum + 1,
                teamAId: sf1_teamAId,
                teamBId: sf1_teamBId,
                venue: defaultVenue,
                status: "SCHEDULED"
              }
            });

            const m2 = await prisma.match.create({
              data: {
                tournamentId: tournament.id,
                stage: "SEMI_FINAL",
                matchNumber: maxMatchNum + 2,
                teamAId: sf2_teamAId,
                teamBId: sf2_teamBId,
                venue: defaultVenue,
                status: "SCHEDULED"
              }
            });

            if (!existingFinal) {
              const mFinal = await prisma.match.create({
                data: {
                  tournamentId: tournament.id,
                  stage: "FINAL",
                  matchNumber: maxMatchNum + 3,
                  teamAId: sf1_teamAId,
                  teamBId: sf2_teamAId,
                  venue: defaultVenue,
                  status: "SCHEDULED"
                }
              });

              if (tournament.sport === "FOOTBALL") {
                await Promise.all([
                  prisma.footballMatchDetail.create({ data: { matchId: m1.id, halfDurationMinutes: 20 } }),
                  prisma.footballMatchDetail.create({ data: { matchId: m2.id, halfDurationMinutes: 20 } }),
                  prisma.footballMatchDetail.create({ data: { matchId: mFinal.id, halfDurationMinutes: 20 } }),
                ]);
              }
            }
          }
        }
      }
    }

    // 2. STAGE: SEMI_FINAL -> Place Winner into Grand Final
    if (match.stage === "SEMI_FINAL" && match.winnerTeamId) {
      const allSemiFinals = await prisma.match.findMany({
        where: { tournamentId: tournament.id, stage: "SEMI_FINAL" },
        orderBy: { matchNumber: "asc" }
      });
      const finalMatch = await prisma.match.findFirst({
        where: { tournamentId: tournament.id, stage: "FINAL" }
      });

      if (finalMatch && allSemiFinals.length >= 2) {
        const isFirstSF = allSemiFinals[0].id === match.id;
        await prisma.match.update({
          where: { id: finalMatch.id },
          data: isFirstSF ? { teamAId: match.winnerTeamId } : { teamBId: match.winnerTeamId }
        });
      }
    }

    // 3. STAGE: FINAL -> Mark tournament COMPLETED & Victor sealed
    if (match.stage === "FINAL" && match.winnerTeamId) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "COMPLETED" }
      });
    }
  } catch (error) {
    console.error("Error advancing tournament knockout progression:", error);
  }
}
