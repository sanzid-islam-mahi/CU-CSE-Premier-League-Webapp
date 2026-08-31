import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radio, Clock, MapPin, Trophy, ArrowRight, Loader2, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { BatchChip } from "@/components/common/BatchChip";

interface LiveMatchCardsProps {
  activeSport: "cricket" | "football";
}

export const LiveMatchCards: React.FC<LiveMatchCardsProps> = ({ activeSport }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMatches = async () => {
      try {
        const data = await api.matches.list({
          sport: activeSport.toUpperCase(),
          limit: 10,
        });
        if (isMounted) {
          setMatches(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load match center matches:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchMatches();

    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchMatches, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSport]);

  const liveMatches = matches.filter((m) =>
    ["LIVE", "INNINGS_BREAK", "HALFTIME", "TOSS"].includes(m.status)
  );
  const upcomingMatches = matches.filter((m) => m.status === "SCHEDULED");
  const completedMatches = matches.filter((m) => m.status === "COMPLETED");

  const featuredMatch = liveMatches[0] || upcomingMatches[0] || completedMatches[0];
  const sideMatch =
    liveMatches.length > 1
      ? liveMatches[1]
      : upcomingMatches.length > 0 && featuredMatch?.id !== upcomingMatches[0]?.id
      ? upcomingMatches[0]
      : upcomingMatches.length > 1 && featuredMatch?.id === upcomingMatches[0]?.id
      ? upcomingMatches[1]
      : completedMatches.find((m) => m.id !== featuredMatch?.id);

  if (loading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-12 bg-white rounded-3xl border border-[#E5DACB] text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#9E2A2B] animate-spin" />
            <p className="text-sm font-semibold text-[#7C6E63]">Loading match center...</p>
          </div>
        </div>
      </section>
    );
  }

  // If no matches exist for this sport
  if (!featuredMatch) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9E2A2B] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                <Radio className="w-3.5 h-3.5" />
                <span>Match Center</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
                {activeSport === "cricket" ? "Cricket Match Arena" : "Football Match Arena"}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-dashed border-[#E5DACB] p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center text-2xl mx-auto border border-[#E8D6C3]">
              {activeSport === "cricket" ? "🏏" : "⚽"}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2C221E]">No Matches Currently Scheduled</h3>
              <p className="text-sm text-[#7C6E63] max-w-md mx-auto mt-1">
                There are no active or scheduled {activeSport} matches right now. Browse our active tournaments or check back on match days!
              </p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-sm shadow-sm transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Tournaments</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isLive = ["LIVE", "INNINGS_BREAK", "HALFTIME", "TOSS"].includes(featuredMatch.status);

  // Cricket Helpers for Featured Match
  const inn1 = featuredMatch.cricketInnings?.find((i: any) => i.inningsNumber === 1);
  const inn2 = featuredMatch.cricketInnings?.find((i: any) => i.inningsNumber === 2);
  const isSecondInnings = isLive && inn2 && !inn2.isCompleted;

  // Active Batters / Bowler for Live Cricket
  const currentInnings = isSecondInnings ? inn2 : inn1;
  const activeBatters = currentInnings?.battingScorecards?.filter((b: any) => !b.isOut).slice(0, 2) || [];
  const currentBowler = currentInnings?.bowlingScorecards?.slice(-1)[0];

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-black uppercase tracking-wider shadow-sm ${
              isLive ? "bg-[#9E2A2B] animate-pulse" : "bg-[#6B5E53]"
            }`}>
              <Radio className="w-3.5 h-3.5" />
              <span>{isLive ? "Live Match Center" : "Match Center"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
              {activeSport === "cricket" ? "Cricket Fixtures & Live Score" : "Football Fixtures & Live Match"}
            </h2>
          </div>

          <span className="text-xs font-semibold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E5DACB]">
            {featuredMatch.venue || "CU Science Faculty Ground"}
          </span>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Featured Match Box */}
          <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-[#9E2A2B]/30 p-4 sm:p-6 shadow-md shadow-[#9E2A2B]/10 relative overflow-hidden flex flex-col justify-between">
            {/* Status Ribbon */}
            <div className="absolute top-0 right-0 px-3 sm:px-4 py-1 sm:py-1.5 bg-[#9E2A2B] text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider sm:tracking-widest rounded-bl-2xl shadow-sm flex items-center gap-1.5 z-10">
              {isLive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  {featuredMatch.status === "TOSS" ? "TOSS" : isSecondInnings ? "LIVE · 2nd INN" : "LIVE NOW"}
                </>
              ) : featuredMatch.status === "COMPLETED" ? (
                <span>FINAL RESULT</span>
              ) : (
                <span>UPCOMING</span>
              )}
            </div>

            <div>
              {/* Tournament Info Header */}
              <div className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4 flex items-center gap-2 flex-wrap pr-24 sm:pr-32">
                <Link to={`/tournaments/${featuredMatch.tournament?.slug || featuredMatch.tournament?.id}`} className="hover:text-[#9E2A2B] transition-colors truncate max-w-[160px] sm:max-w-none">
                  {featuredMatch.tournament?.name}
                </Link>
                <span>•</span>
                <span className="text-[#9E2A2B] font-extrabold shrink-0">
                  {featuredMatch.group?.name ? `${featuredMatch.group.name} · ` : ""}Match #{featuredMatch.matchNumber}
                </span>
                {featuredMatch.stage && (
                  <>
                    <span>•</span>
                    <span className="shrink-0">{featuredMatch.stage.replace(/_/g, " ")}</span>
                  </>
                )}
              </div>

              {/* CRICKET LIVE / COMPLETED DISPLAY */}
              {activeSport === "cricket" && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-[#EFE8DC]">
                    {/* Team A */}
                    <div className={`space-y-1.5 p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      currentInnings?.battingTeamId === featuredMatch.teamAId && isLive
                        ? "bg-[#FBEFE9] border-2 border-[#9E2A2B]/40"
                        : "bg-[#FAF7F2] border-[#E8DCCF]"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7C6E63]">
                          {inn1?.battingTeamId === featuredMatch.teamAId ? "1st Innings" : inn2?.battingTeamId === featuredMatch.teamAId ? "2nd Innings" : "Team A"}
                        </span>
                        {inn1?.battingTeamId === featuredMatch.teamAId && (
                          <span className="text-[11px] font-semibold text-[#6B5E53]">{inn1.totalOvers} ov</span>
                        )}
                        {inn2?.battingTeamId === featuredMatch.teamAId && (
                          <span className="text-[11px] font-semibold text-[#6B5E53]">{inn2.totalOvers} ov</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <SmartAvatar
                            src={featuredMatch.teamA?.logoUrl}
                            alt={featuredMatch.teamA?.name}
                            fallbackText={featuredMatch.teamA?.shortName || "A"}
                            size="sm"
                            shape="rounded"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-[#2C221E] text-sm sm:text-base truncate block">{featuredMatch.teamA?.name}</span>
                            {featuredMatch.teamA?.batch && (
                              <BatchChip
                                name={featuredMatch.teamA.batch.name}
                                session={featuredMatch.teamA.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {inn1?.battingTeamId === featuredMatch.teamAId ? (
                            <span className="text-lg sm:text-xl font-black text-[#2C221E]">
                              {inn1.totalRuns}<span className="text-xs sm:text-sm font-bold text-[#7C6E63]">/{inn1.totalWickets}</span>
                            </span>
                          ) : inn2?.battingTeamId === featuredMatch.teamAId ? (
                            <span className="text-lg sm:text-xl font-black text-[#9E2A2B]">
                              {inn2.totalRuns}<span className="text-xs sm:text-sm font-bold text-[#842021]">/{inn2.totalWickets}</span>
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[#7C6E63]">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team B */}
                    <div className={`space-y-1.5 p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      currentInnings?.battingTeamId === featuredMatch.teamBId && isLive
                        ? "bg-[#FBEFE9] border-2 border-[#9E2A2B]/40"
                        : "bg-[#FAF7F2] border-[#E8DCCF]"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7C6E63]">
                          {inn1?.battingTeamId === featuredMatch.teamBId ? "1st Innings" : inn2?.battingTeamId === featuredMatch.teamBId ? "2nd Innings" : "Team B"}
                        </span>
                        {inn1?.battingTeamId === featuredMatch.teamBId && (
                          <span className="text-[11px] font-semibold text-[#6B5E53]">{inn1.totalOvers} ov</span>
                        )}
                        {inn2?.battingTeamId === featuredMatch.teamBId && (
                          <span className="text-[11px] font-semibold text-[#6B5E53]">{inn2.totalOvers} ov</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <SmartAvatar
                            src={featuredMatch.teamB?.logoUrl}
                            alt={featuredMatch.teamB?.name}
                            fallbackText={featuredMatch.teamB?.shortName || "B"}
                            size="sm"
                            shape="rounded"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-[#2C221E] text-sm sm:text-base truncate block">{featuredMatch.teamB?.name}</span>
                            {featuredMatch.teamB?.batch && (
                              <BatchChip
                                name={featuredMatch.teamB.batch.name}
                                session={featuredMatch.teamB.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {inn1?.battingTeamId === featuredMatch.teamBId ? (
                            <span className="text-lg sm:text-xl font-black text-[#2C221E]">
                              {inn1.totalRuns}<span className="text-xs sm:text-sm font-bold text-[#7C6E63]">/{inn1.totalWickets}</span>
                            </span>
                          ) : inn2?.battingTeamId === featuredMatch.teamBId ? (
                            <span className="text-lg sm:text-xl font-black text-[#9E2A2B]">
                              {inn2.totalRuns}<span className="text-xs sm:text-sm font-bold text-[#842021]">/{inn2.totalWickets}</span>
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[#7C6E63]">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Result Summary or Target Equation */}
                  {featuredMatch.resultSummary ? (
                    <div className="py-2.5 px-3.5 my-3 rounded-xl bg-[#FAF0E6] border border-[#E8D6C3] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#842021] flex-wrap gap-1">
                      <span>🏆 {featuredMatch.resultSummary}</span>
                      {featuredMatch.playerOfTheMatch && (
                        <span className="text-xs font-semibold text-[#7C6E63]">
                          POTM: {featuredMatch.playerOfTheMatch.name}
                        </span>
                      )}
                    </div>
                  ) : isSecondInnings && inn1 ? (
                    <div className="py-2.5 px-3.5 my-3 rounded-xl bg-[#FAF0E6] border border-[#E8D6C3] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#842021] flex-wrap gap-1">
                      <span>
                        🎯 Target: {inn1.totalRuns + 1} ({inn1.totalRuns + 1 - inn2.totalRuns} runs needed)
                      </span>
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-md border border-[#D8C7B3]">
                        CRR: {inn2.totalOvers > 0 ? (inn2.totalRuns / inn2.totalOvers).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  ) : null}

                  {/* Active Players Spotlight if Live */}
                  {isLive && activeBatters.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                      <div className="p-3 bg-[#FAF7F2] rounded-xl space-y-1.5">
                        <p className="font-bold text-[#7C6E63] text-[11px] uppercase">Batting at Crease</p>
                        {activeBatters.map((b: any, idx: number) => (
                          <div key={idx} className="flex justify-between font-semibold text-[#2C221E]">
                            <span className="truncate pr-1">🏏 {b.player?.name} {idx === 0 ? "*" : ""}</span>
                            <span className="font-mono text-[#9E2A2B] shrink-0">{b.runs} ({b.balls})</span>
                          </div>
                        ))}
                      </div>

                      {currentBowler && (
                        <div className="p-3 bg-[#FAF7F2] rounded-xl space-y-1.5">
                          <p className="font-bold text-[#7C6E63] text-[11px] uppercase">Current Bowler</p>
                          <div className="flex justify-between font-semibold text-[#2C221E]">
                            <span className="truncate pr-1">🎯 {currentBowler.player?.name}</span>
                            <span className="font-mono text-[#9E2A2B] shrink-0">{currentBowler.overs}-{currentBowler.maidens}-{currentBowler.runs}-{currentBowler.wickets}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* FOOTBALL LIVE / COMPLETED DISPLAY */}
              {activeSport === "football" && (
                <div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCF] mb-3 sm:mb-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      {/* Team A (Home / Left) */}
                      <div className="flex-1 text-center min-w-0 space-y-1">
                        <SmartAvatar
                          src={featuredMatch.teamA?.logoUrl}
                          alt={featuredMatch.teamA?.name}
                          fallbackText={featuredMatch.teamA?.shortName || "A"}
                          size="md"
                          shape="rounded"
                          className="mx-auto shadow-2xs w-10 h-10 sm:w-14 sm:h-14"
                        />
                        <p className="font-extrabold text-[#2C221E] text-xs sm:text-base truncate max-w-[100px] sm:max-w-[160px] mx-auto">{featuredMatch.teamA?.name}</p>
                        {featuredMatch.teamA?.batch && (
                          <div className="hidden sm:block">
                            <BatchChip
                              name={featuredMatch.teamA.batch.name}
                              session={featuredMatch.teamA.batch.session}
                              size="xs"
                              variant="inline"
                              className="text-[10px]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Score (Center) */}
                      <div className="px-3 sm:px-6 py-2 sm:py-3 rounded-2xl bg-white border-2 border-[#9E2A2B]/30 shadow-xs text-center shrink-0 min-w-[85px] sm:min-w-[130px]">
                        <span className="text-2xl sm:text-4xl font-black text-[#9E2A2B] tracking-tight font-mono">
                          {featuredMatch.footballDetail?.teamAScore ?? 0} - {featuredMatch.footballDetail?.teamBScore ?? 0}
                        </span>
                        {isLive && (
                          <p className="text-[9px] sm:text-[10px] font-bold text-[#842021] uppercase tracking-wider mt-0.5">
                            {featuredMatch.status === "HALFTIME"
                              ? "HALFTIME"
                              : `${Math.floor((featuredMatch.footballDetail?.clockSeconds || 0) / 60)}' · ${
                                  featuredMatch.footballDetail?.currentHalf === 1 ? "1st Half" : "2nd Half"
                                }`}
                          </p>
                        )}
                        {!isLive && featuredMatch.status === "COMPLETED" && (
                          <p className="text-[9px] sm:text-[10px] font-bold text-[#7C6E63] uppercase tracking-wider mt-0.5">
                            FULL TIME
                          </p>
                        )}
                      </div>

                      {/* Team B (Away / Right) */}
                      <div className="flex-1 text-center min-w-0 space-y-1">
                        <SmartAvatar
                          src={featuredMatch.teamB?.logoUrl}
                          alt={featuredMatch.teamB?.name}
                          fallbackText={featuredMatch.teamB?.shortName || "B"}
                          size="md"
                          shape="rounded"
                          className="mx-auto shadow-2xs w-10 h-10 sm:w-14 sm:h-14"
                        />
                        <p className="font-extrabold text-[#2C221E] text-xs sm:text-base truncate max-w-[100px] sm:max-w-[160px] mx-auto">{featuredMatch.teamB?.name}</p>
                        {featuredMatch.teamB?.batch && (
                          <div className="hidden sm:block">
                            <BatchChip
                              name={featuredMatch.teamB.batch.name}
                              session={featuredMatch.teamB.batch.session}
                              size="xs"
                              variant="inline"
                              className="text-[10px]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Football Events Timeline */}
                  {featuredMatch.footballEvents && featuredMatch.footballEvents.length > 0 && (
                    <div className="space-y-1.5 my-3">
                      <p className="text-[11px] font-bold text-[#7C6E63] uppercase tracking-wider">Latest Events</p>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {featuredMatch.footballEvents.slice(-4).map((ev: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white rounded-lg border border-[#E5DACB] text-[#2C221E] font-medium flex items-center gap-1 text-[11px]"
                          >
                            <span>{ev.eventType.includes("GOAL") ? "⚽" : ev.eventType.includes("YELLOW") ? "🟨" : "🟥"}</span>
                            <span className="font-mono text-[#9E2A2B] font-bold">{ev.minute}'</span>
                            <strong className="truncate max-w-[90px]">{ev.primaryPlayer?.name}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {featuredMatch.resultSummary && (
                    <div className="py-2 px-3.5 my-2.5 rounded-xl bg-[#FAF0E6] border border-[#E8D6C3] text-xs sm:text-sm font-extrabold text-[#842021]">
                      🏆 {featuredMatch.resultSummary}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Match Actions */}
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[#EFE8DC] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#7C6E63] truncate">
                <MapPin className="w-3.5 h-3.5 text-[#9E2A2B] shrink-0" />
                <span className="truncate">{featuredMatch.venue || "CU Main Ground"}</span>
              </div>
              <Link
                to={`/matches/${featuredMatch.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#9E2A2B] hover:text-[#842021] bg-[#FBEFE9] px-3 py-1.5 rounded-xl border border-[#9E2A2B]/20 transition-all hover:scale-105 shrink-0"
              >
                <span>{isLive ? "Live Match Center" : "Match Details"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Side Match Box (Next Fixture or Recent Result) */}
          <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs flex flex-col justify-between">
            {sideMatch ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] text-[11px] font-bold">
                      {sideMatch.status === "SCHEDULED" ? "NEXT FIXTURE" : "RECENT RESULT"}
                    </span>
                    <span className="text-xs text-[#7C6E63] font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      {sideMatch.startTime
                        ? new Date(sideMatch.startTime).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "TBD"}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4">
                    {sideMatch.tournament?.name} · Match #{sideMatch.matchNumber}
                  </p>

                  <div className="space-y-4 my-6">
                    {/* Team A */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SmartAvatar
                          src={sideMatch.teamA?.logoUrl}
                          alt={sideMatch.teamA?.name}
                          fallbackText={sideMatch.teamA?.shortName || "A"}
                          size="sm"
                          shape="rounded"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#2C221E] text-sm truncate block">{sideMatch.teamA?.name}</span>
                          {sideMatch.teamA?.batch && (
                            <BatchChip
                              name={sideMatch.teamA.batch.name}
                              session={sideMatch.teamA.batch.session}
                              size="xs"
                              variant="inline"
                              className="text-[10px]"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center font-extrabold text-xs text-[#9E2A2B]">VS</div>

                    {/* Team B */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SmartAvatar
                          src={sideMatch.teamB?.logoUrl}
                          alt={sideMatch.teamB?.name}
                          fallbackText={sideMatch.teamB?.shortName || "B"}
                          size="sm"
                          shape="rounded"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#2C221E] text-sm truncate block">{sideMatch.teamB?.name}</span>
                          {sideMatch.teamB?.batch && (
                            <BatchChip
                              name={sideMatch.teamB.batch.name}
                              session={sideMatch.teamB.batch.session}
                              size="xs"
                              variant="inline"
                              className="text-[10px]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                    <span>{sideMatch.venue || "CU Science Faculty Ground"}</span>
                  </div>
                  <Link
                    to={`/matches/${sideMatch.id}`}
                    className="font-bold text-[#9E2A2B] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Calendar className="w-8 h-8 text-[#A89A8D]" />
                <p className="text-sm font-bold text-[#2C221E]">More Fixtures Coming Soon</p>
                <p className="text-xs text-[#7C6E63]">
                  Check the tournaments section to see complete tournament schedules.
                </p>
                <Link
                  to="/tournaments"
                  className="text-xs font-black text-[#9E2A2B] hover:underline pt-2"
                >
                  View All Tournaments →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
