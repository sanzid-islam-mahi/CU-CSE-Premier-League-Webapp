import React from "react";
import { TrendingUp, Users, Target, Activity } from "lucide-react";

interface CricketLiveAnalyticsProps {
  match: any;
  activeInningsNumber?: number;
}

export const CricketLiveAnalytics: React.FC<CricketLiveAnalyticsProps> = ({
  match,
  activeInningsNumber = 1,
}) => {
  const currentInnings = match.cricketInnings?.find(
    (x: any) => x.inningsNumber === activeInningsNumber
  ) || match.cricketInnings?.[0];

  const innings1 = match.cricketInnings?.find((x: any) => x.inningsNumber === 1);
  const isSecondInnings = activeInningsNumber === 2 || (match.cricketInnings?.length === 2 && !innings1?.isCompleted);
  const targetRuns = innings1 ? innings1.totalRuns + 1 : null;

  // Max overs from tournament rules or default 10 (T10)
  const maxOvers = match.tournament?.rules?.maxOversPerInnings || 10;
  const maxBalls = maxOvers * 6;

  // Calculate legal balls delivered in current innings
  const balls = currentInnings?.balls || [];
  let legalBallsCount = 0;
  balls.forEach((b: any) => {
    if (b.extraType !== "WIDE" && b.extraType !== "NO_BALL") {
      legalBallsCount++;
    }
  });

  const ballsRemaining = Math.max(0, maxBalls - legalBallsCount);
  const currentRuns = currentInnings?.totalRuns || 0;
  const currentWickets = currentInnings?.totalWickets || 0;
  const wicketsInHand = Math.max(0, 10 - currentWickets);
  const runsNeeded = targetRuns ? Math.max(0, targetRuns - currentRuns) : 0;
  const currentOversFloat = Math.floor(legalBallsCount / 6) + (legalBallsCount % 6) / 6;
  const currentRunRate = currentOversFloat > 0 ? (currentRuns / currentOversFloat) : 0;
  const requiredRunRate = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 0;

  // Win Probability calculation (heuristic estimate for 2nd innings)
  let winProbBatting = 50;
  if (isSecondInnings && targetRuns) {
    if (runsNeeded === 0) winProbBatting = 100;
    else if (wicketsInHand === 0 || (ballsRemaining === 0 && runsNeeded > 0)) winProbBatting = 0;
    else {
      // ratio of RRR to CRR adjusted for wickets
      const diff = requiredRunRate - currentRunRate;
      const wicketBonus = (wicketsInHand - 5) * 5;
      winProbBatting = Math.min(95, Math.max(5, Math.round(50 - diff * 8 + wicketBonus)));
    }
  }

  // 1. Calculate Current Partnership
  // Find index of the last wicket delivery
  let lastWicketIndex = -1;
  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].isWicket) {
      lastWicketIndex = i;
      break;
    }
  }

  const partnershipBalls = balls.slice(lastWicketIndex + 1);
  let pRuns = 0;
  let pBalls = 0;
  const batterStatsMap = new Map<number, { name: string; runs: number; balls: number }>();

  partnershipBalls.forEach((b: any) => {
    const extraToAdd = b.extraType === "WIDE" || b.extraType === "NO_BALL" ? (1 + b.extraRuns) : b.extraRuns;
    pRuns += (b.runsBat + extraToAdd);
    if (b.extraType !== "WIDE") pBalls++;

    if (b.strikerId) {
      if (!batterStatsMap.has(b.strikerId)) {
        batterStatsMap.set(b.strikerId, { name: b.striker?.name || "Batter", runs: 0, balls: 0 });
      }
      const st = batterStatsMap.get(b.strikerId)!;
      st.runs += b.runsBat;
      if (b.extraType !== "WIDE") st.balls++;
    }
  });

  const pBatters = Array.from(batterStatsMap.values());

  // 2. Group balls by Over for Recent Overs Breakdown & Manhattan Chart
  const overMap = new Map<number, { overNumber: number; bowlerName: string; balls: any[]; runs: number; wickets: number }>();
  balls.forEach((b: any) => {
    const oNum = b.overNumber;
    if (!overMap.has(oNum)) {
      overMap.set(oNum, {
        overNumber: oNum,
        bowlerName: b.bowler?.name || "Bowler",
        balls: [],
        runs: 0,
        wickets: 0,
      });
    }
    const oData = overMap.get(oNum)!;
    oData.balls.push(b);
    const extraToAdd = b.extraType === "WIDE" || b.extraType === "NO_BALL" ? (1 + b.extraRuns) : b.extraRuns;
    oData.runs += (b.runsBat + extraToAdd);
    if (b.isWicket) oData.wickets++;
    if (b.bowler?.name) oData.bowlerName = b.bowler.name;
  });

  const oversList = Array.from(overMap.values()).sort((a, b) => a.overNumber - b.overNumber);
  const maxOverRuns = Math.max(12, ...oversList.map((o) => o.runs));

  // 3. Calculate Fall of Wickets (FOW)
  const fallOfWickets: Array<{ wicketNum: number; score: number; overStr: string; playerName: string }> = [];
  let runningScore = 0;
  let runningLegals = 0;
  let wCount = 0;

  balls.forEach((b: any) => {
    const isLegal = b.extraType !== "WIDE" && b.extraType !== "NO_BALL";
    if (isLegal) runningLegals++;
    const extraToAdd = b.extraType === "WIDE" || b.extraType === "NO_BALL" ? (1 + b.extraRuns) : b.extraRuns;
    runningScore += (b.runsBat + extraToAdd);

    if (b.isWicket) {
      wCount++;
      const ovStr = `${Math.floor(runningLegals / 6)}.${runningLegals % 6}`;
      fallOfWickets.push({
        wicketNum: wCount,
        score: runningScore,
        overStr: ovStr,
        playerName: b.playerOut?.name || b.striker?.name || `Wicket #${wCount}`,
      });
    }
  });

  const battingTeam = currentInnings?.battingTeamId === match.teamAId ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings?.bowlingTeamId === match.teamAId ? match.teamA : match.teamB;

  return (
    <div className="space-y-5">
      
      {/* 1. MATCH EQUATION & WIN PREDICTOR / PROJECTOR BAR */}
      <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-4">
        {isSecondInnings && targetRuns ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#9E2A2B]" />
                <span className="font-black text-sm text-[#2C221E]">
                  Match Equation: Need <strong className="text-[#9E2A2B]">{runsNeeded} runs</strong> in{" "}
                  <strong>{ballsRemaining} balls</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-[#7C6E63]">
                <span>Req. RR: <strong className="text-[#2C221E]">{requiredRunRate.toFixed(2)}</strong></span>
                <span>· Wkts in Hand: <strong className="text-[#2A7B54]">{wicketsInHand}</strong></span>
              </div>
            </div>

            {/* Win Predictor Meter */}
            <div className="space-y-1.5 pt-2 border-t border-[#EFE8DC]">
              <div className="flex justify-between text-[11px] font-black">
                <span className="text-[#9E2A2B]">{battingTeam?.name}: {winProbBatting}%</span>
                <span className="text-[#7C6E63]">{bowlingTeam?.name}: {100 - winProbBatting}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#EFE8DC] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#9E2A2B] transition-all duration-500 rounded-l-full"
                  style={{ width: `${winProbBatting}%` }}
                />
                <div
                  className="h-full bg-[#7C6E63] transition-all duration-500 rounded-r-full"
                  style={{ width: `${100 - winProbBatting}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 1st Innings Projector */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#9E2A2B]" />
              <div>
                <span className="text-xs font-black text-[#2C221E] block">Live Score Projector</span>
                <span className="text-[11px] text-[#7C6E63]">
                  Current: {currentRuns}/{currentWickets} @ {currentRunRate.toFixed(2)} RPO ({currentInnings?.totalOvers || 0} ov)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="p-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF]">
                <span className="text-[10px] text-[#7C6E63] block uppercase">@ Current RR</span>
                <span className="font-mono font-black text-[#9E2A2B]">
                  {Math.round(currentRunRate * maxOvers)} runs
                </span>
              </div>
              <div className="p-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF]">
                <span className="text-[10px] text-[#7C6E63] block uppercase">@ 10.0 RPO</span>
                <span className="font-mono font-black text-[#2C221E]">
                  {Math.round(currentRuns + (ballsRemaining / 6) * 10)} runs
                </span>
              </div>
              <div className="p-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF]">
                <span className="text-[10px] text-[#7C6E63] block uppercase">@ 12.0 RPO</span>
                <span className="font-mono font-black text-[#2A7B54]">
                  {Math.round(currentRuns + (ballsRemaining / 6) * 12)} runs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. CURRENT PARTNERSHIP WIDGET */}
      <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
          <h3 className="text-xs font-black uppercase text-[#7C6E63] flex items-center gap-1.5 tracking-wider">
            <Users className="w-4 h-4 text-[#9E2A2B]" />
            <span>Current Partnership</span>
          </h3>
          <span className="font-mono text-xs font-black text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-0.5 rounded-full border border-[#E8D6C3]">
            {pRuns} runs ({pBalls} balls)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {pBatters.map((b, idx) => (
            <div key={idx} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-[#2C221E]">{b.name}</p>
                <p className="text-[10px] text-[#7C6E63]">Contribution</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-black text-[#2C221E]">{b.runs}</span>
                <span className="text-[11px] text-[#7C6E63] font-bold"> ({b.balls}b)</span>
              </div>
            </div>
          ))}

          {pBatters.length === 0 && (
            <p className="text-xs text-[#A89A8D] italic col-span-2 text-center py-2">
              Partnership will form as deliveries are bowled.
            </p>
          )}
        </div>
      </div>

      {/* 3. MANHATTAN CHART (RUNS PER OVER WITH WICKET MARKERS) */}
      {oversList.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
            <h3 className="text-xs font-black uppercase text-[#7C6E63] flex items-center gap-1.5 tracking-wider">
              <Activity className="w-4 h-4 text-[#9E2A2B]" />
              <span>Manhattan Run Rate Graph</span>
            </h3>
            <span className="text-[11px] font-bold text-[#7C6E63]">
              {oversList.length} / {maxOvers} Overs Completed
            </span>
          </div>

          <div className="flex items-end gap-2 pt-6 pb-2 h-36 overflow-x-auto px-2">
            {oversList.map((ov) => {
              const heightPercent = Math.min(100, Math.max(15, (ov.runs / maxOverRuns) * 100));
              return (
                <div key={ov.overNumber} className="flex flex-col items-center gap-1.5 flex-1 min-w-10 group">
                  {/* Wicket pin above bar */}
                  <div className="h-5 flex items-center justify-center">
                    {ov.wickets > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#C92A2A] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-bounce">
                        {ov.wickets}W
                      </span>
                    )}
                  </div>

                  {/* Over Bar */}
                  <div className="w-full bg-[#FAF0E6] rounded-t-xl overflow-hidden flex flex-col justify-end h-20 relative">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-xl flex items-center justify-center font-mono text-[10px] font-black text-white ${
                        ov.wickets > 0 ? "bg-[#C92A2A]" : "bg-[#9E2A2B]"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {ov.runs > 0 ? ov.runs : ""}
                    </div>
                  </div>

                  {/* Over label */}
                  <span className="text-[10px] font-mono font-bold text-[#7C6E63]">
                    Ov {ov.overNumber + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. RECENT OVERS DETAILED CAROUSEL */}
      {oversList.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-[#7C6E63] tracking-wider">
            Recent Overs Breakdown
          </h3>

          <div className="max-h-64 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {oversList.slice().reverse().map((ov) => (
              <div key={ov.overNumber} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-[#9E2A2B] bg-white px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                    Over {ov.overNumber + 1}
                  </span>
                  <div>
                    <p className="font-bold text-[#2C221E]">{ov.bowlerName}</p>
                    <p className="text-[11px] text-[#7C6E63]">
                      {ov.runs} runs · {ov.wickets} wicket(s)
                    </p>
                  </div>
                </div>

                {/* Delivery Badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {ov.balls.map((b: any) => (
                    <span
                      key={b.id}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-[10px] shrink-0 ${
                        b.isWicket
                          ? "bg-[#C92A2A] text-white"
                          : b.runsBat === 4 || b.runsBat === 6
                          ? "bg-[#2A7B54] text-white"
                          : b.extraType === "WIDE" || b.extraType === "NO_BALL"
                          ? "bg-[#FFF9DB] text-[#F59F00] border border-[#F59F00]"
                          : "bg-white text-[#2C221E] border border-[#E8DCCF]"
                      }`}
                    >
                      {b.isWicket ? "W" : b.extraType === "WIDE" ? "Wd" : b.extraType === "NO_BALL" ? "Nb" : b.runsBat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FALL OF WICKETS (FOW) TABLE */}
      {fallOfWickets.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-black text-xs uppercase text-[#7C6E63] tracking-wider">
            Fall of Wickets (FOW)
          </h3>

          <div className="flex flex-wrap gap-2">
            {fallOfWickets.map((fow) => (
              <span
                key={fow.wicketNum}
                className="p-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] text-xs font-bold text-[#2C221E] flex items-center gap-1.5"
              >
                <strong className="text-[#C92A2A]">{fow.wicketNum}-{fow.score}</strong>
                <span className="text-[#7C6E63]">({fow.playerName}, {fow.overStr} ov)</span>
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
