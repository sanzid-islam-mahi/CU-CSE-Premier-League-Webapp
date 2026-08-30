import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Trophy, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Shield, 
  Award, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Activity,
  Users,
  Sparkles,
  BarChart3,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CricketLiveAnalytics } from "@/components/matches/CricketLiveAnalytics";
import { MatchStoryCardModal } from "@/components/matches/MatchStoryCardModal";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";
import { PlayerChip } from "@/components/common/PlayerChip";
import { BatchChip } from "@/components/common/BatchChip";

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [matchData, setMatchData] = useState<any>(null);
  const [isScorer, setIsScorer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"commentary" | "analytics" | "scorecard" | "lineups" | "info" | "gallery">("commentary");
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Football Live Ticking Stopwatch for Viewer
  const [footballTimerSeconds, setFootballTimerSeconds] = useState(0);

  useEffect(() => {
    fetchMatchDetails();
    const interval = setInterval(fetchMatchDetails, 5000); // 5-second live polling
    return () => clearInterval(interval);
  }, [matchId]);

  // Sync and tick football timer locally
  useEffect(() => {
    if (matchData?.footballDetail) {
      setFootballTimerSeconds(matchData.footballDetail.clockSeconds || 0);
    }
  }, [matchData?.footballDetail?.clockSeconds]);

  useEffect(() => {
    let timer: any = null;
    if (matchData?.footballDetail?.isClockRunning) {
      timer = setInterval(() => {
        setFootballTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchData?.footballDetail?.isClockRunning]);

  const fetchMatchDetails = async () => {
    try {
      const res = await api.scoring.getLive(matchId);
      setMatchData(res.match);
      setIsScorer(res.isScorer);
    } catch (err: any) {
      setError(err.message || "Failed to load match details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="flex items-center gap-2 font-bold text-[#7C6E63]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#9E2A2B]" />
          <span>Loading Match Arena...</span>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border-2 border-[#E5DACB] text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-[#C92A2A] mx-auto" />
          <h2 className="text-lg font-black text-[#2C221E]">Match Not Found</h2>
          <p className="text-xs text-[#7C6E63]">{error || "Could not load match."}</p>
          <Link to="/tournaments">
            <Button className="bg-[#9E2A2B] text-white text-xs font-bold rounded-xl">Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCricket = matchData.tournament.sport === "CRICKET";
  const innings1 = matchData.cricketInnings?.find((x: any) => x.inningsNumber === 1);
  const innings2 = matchData.cricketInnings?.find((x: any) => x.inningsNumber === 2);

  // Helper: Get match day squad (On Pitch + Subbed Out only, not entire batch roster)
  const getTeamMatchSquad = (teamId: number) => {
    const team = teamId === matchData.teamAId ? matchData.teamA : matchData.teamB;
    if (!team) return { onPitch: [], subbedOut: [], totalInMatch: 0 };

    const squadEntries = matchData.matchSquads?.filter((s: any) => s.teamId === teamId) || [];
    
    if (isCricket) {
      if (squadEntries.length > 0) {
        const playingXI = squadEntries.filter((s: any) => s.isPlayingXI);
        return {
          onPitch: playingXI.map((s: any) => ({
            userId: s.userId,
            user: s.user || team.members?.find((m: any) => m.userId === s.userId)?.user,
            battingOrder: s.battingOrder,
          })),
          subbedOut: [],
          totalInMatch: playingXI.length
        };
      }
      const fallbackXI = (team.members || []).slice(0, 11).map((m: any, idx: number) => ({
        userId: m.userId,
        user: m.user,
        battingOrder: idx + 1,
      }));
      return {
        onPitch: fallbackXI,
        subbedOut: [],
        totalInMatch: fallbackXI.length
      };
    }

    // Football
    const subEvents = matchData.footballEvents?.filter(
      (ev: any) => ev.eventType === "SUBSTITUTION" && ev.teamId === teamId
    ) || [];

    // Red Carded / Sent Off players
    const redCardMap = new Map<number, { minute: number }>();
    const yellowCounts = new Map<number, number>();
    (matchData.footballEvents || []).forEach((ev: any) => {
      if (ev.teamId !== teamId) return;
      if (ev.eventType === "RED_CARD") {
        redCardMap.set(ev.primaryPlayerId, { minute: ev.minute });
      } else if (ev.eventType === "YELLOW_CARD") {
        const count = (yellowCounts.get(ev.primaryPlayerId) || 0) + 1;
        yellowCounts.set(ev.primaryPlayerId, count);
        if (count >= 2) {
          redCardMap.set(ev.primaryPlayerId, { minute: ev.minute });
        }
      }
    });

    const subbedOutMap = new Map<number, { minute: number; subbedInName?: string }>();
    subEvents.forEach((ev: any) => {
      if (ev.secondaryPlayerId) {
        subbedOutMap.set(ev.secondaryPlayerId, {
          minute: ev.minute,
          subbedInName: ev.primaryPlayer?.name
        });
      }
    });

    const subbedInMap = new Map<number, { minute: number; subbedOutName?: string }>();
    subEvents.forEach((ev: any) => {
      if (ev.primaryPlayerId) {
        subbedInMap.set(ev.primaryPlayerId, {
          minute: ev.minute,
          subbedOutName: ev.secondaryPlayer?.name
        });
      }
    });

    if (squadEntries.length > 0) {
      const onPitchSquad = squadEntries
        .filter((s: any) => s.isPlayingXI && !redCardMap.has(s.userId))
        .map((s: any) => ({
          userId: s.userId,
          user: s.user || team.members?.find((m: any) => m.userId === s.userId)?.user,
          subbedIn: subbedInMap.get(s.userId),
        }));

      const subbedOutSquad: any[] = squadEntries
        .filter((s: any) => !s.isPlayingXI && subbedOutMap.has(s.userId) && !redCardMap.has(s.userId))
        .map((s: any) => ({
          userId: s.userId,
          user: s.user || team.members?.find((m: any) => m.userId === s.userId)?.user,
          subbedOut: subbedOutMap.get(s.userId),
        }));

      // In case an event has a secondaryPlayerId not explicitly in squadEntries
      subEvents.forEach((ev: any) => {
        if (ev.secondaryPlayerId && !subbedOutSquad.some((p: any) => p.userId === ev.secondaryPlayerId) && !redCardMap.has(ev.secondaryPlayerId)) {
          const userObj = ev.secondaryPlayer || team.members?.find((m: any) => m.userId === ev.secondaryPlayerId)?.user;
          if (userObj) {
            subbedOutSquad.push({
              userId: ev.secondaryPlayerId,
              user: userObj,
              subbedOut: { minute: ev.minute, subbedInName: ev.primaryPlayer?.name }
            });
          }
        }
      });

      const sentOffSquad: any[] = [];
      redCardMap.forEach((val, userId) => {
        const userObj = team.members?.find((m: any) => m.userId === userId)?.user || squadEntries.find((s: any) => s.userId === userId)?.user;
        if (userObj) {
          sentOffSquad.push({
            userId,
            user: userObj,
            minute: val.minute
          });
        }
      });

      return {
        onPitch: onPitchSquad,
        subbedOut: subbedOutSquad,
        sentOff: sentOffSquad,
        totalInMatch: onPitchSquad.length + subbedOutSquad.length + sentOffSquad.length
      };
    }

    const fallbackOnPitch = (team.members || []).slice(0, 11).filter((m: any) => !redCardMap.has(m.userId)).map((m: any) => ({
      userId: m.userId,
      user: m.user,
      subbedIn: undefined
    }));

    const sentOffFallback: any[] = [];
    redCardMap.forEach((val, userId) => {
      const userObj = team.members?.find((m: any) => m.userId === userId)?.user;
      if (userObj) {
        sentOffFallback.push({
          userId,
          user: userObj,
          minute: val.minute
        });
      }
    });

    return {
      onPitch: fallbackOnPitch,
      subbedOut: [],
      sentOff: sentOffFallback,
      totalInMatch: fallbackOnPitch.length + sentOffFallback.length
    };
  };

  const teamASquad = getTeamMatchSquad(matchData.teamAId);
  const teamBSquad = getTeamMatchSquad(matchData.teamBId);

  // Football Helpers: Live Phase Badge & Ticking Clock
  const formatFootballClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getFootballPhaseBadge = () => {
    if (!matchData?.footballDetail) return null;
    const { currentHalf, isClockRunning } = matchData.footballDetail;
    const status = matchData.status;

    if (status === "SCHEDULED") {
      return { text: "Upcoming", color: "bg-[#FAF0E6] text-[#842021] border-[#E8D6C3]" };
    }

    if (currentHalf === 5 && status === "LIVE") {
      return {
        text: "🔴 LIVE: PENALTY SHOOTOUT 🥅",
        color: "bg-[#FFF5F5] text-[#C92A2A] animate-pulse border-[#FF8787] font-black"
      };
    }

    if (status === "COMPLETED") {
      if (matchData.footballDetail.teamAPenaltyScore !== null && matchData.footballDetail.teamAPenaltyScore !== undefined) {
        return { text: "Full Time (FT-PEN) 🏆", color: "bg-[#E6FCF5] text-[#0CA678] border-[#20C997] font-black" };
      }
      return { text: "Full Time (FT)", color: "bg-[#E6FCF5] text-[#0CA678] border-[#20C997] font-bold" };
    }

    if (currentHalf === 1) {
      return {
        text: isClockRunning ? `1st Half · ${formatFootballClock(footballTimerSeconds)}` : "1st Half (Paused)",
        color: isClockRunning ? "bg-[#EBFBEE] text-[#2B8A3E] border-[#B2F2BB] animate-pulse font-bold" : "bg-[#FFF9DB] text-[#F59F00] border-[#FFE066] font-bold"
      };
    }

    if (currentHalf === 2) {
      return {
        text: isClockRunning ? `2nd Half · ${formatFootballClock(footballTimerSeconds)}` : "2nd Half (Paused)",
        color: isClockRunning ? "bg-[#EBFBEE] text-[#2B8A3E] border-[#B2F2BB] animate-pulse font-bold" : "bg-[#FFF9DB] text-[#F59F00] border-[#FFE066] font-bold"
      };
    }

    return { text: "LIVE", color: "bg-[#FFF5F5] text-[#C92A2A] border-[#FF8787]" };
  };

  const getTeamGoalscorers = (teamId: number) => {
    if (!matchData?.footballEvents) return [];
    return matchData.footballEvents
      .filter((ev: any) => ev.teamId === teamId && ev.eventType === "GOAL")
      .map((ev: any) => ({
        id: ev.id,
        minute: ev.minute,
        playerName: ev.primaryPlayer?.name || "Player",
        assistName: ev.secondaryPlayer?.name
      }));
  };

  const teamAGoalscorers = !isCricket ? getTeamGoalscorers(matchData.teamAId) : [];
  const teamBGoalscorers = !isCricket ? getTeamGoalscorers(matchData.teamBId) : [];

  const getFootballStats = () => {
    if (!matchData?.footballDetail) return [];
    const events = matchData.footballEvents || [];

    const goalsA = matchData.footballDetail.teamAScore || 0;
    const goalsB = matchData.footballDetail.teamBScore || 0;

    const cornersA = matchData.footballDetail.teamACorners || 0;
    const cornersB = matchData.footballDetail.teamBCorners || 0;

    const foulsA = matchData.footballDetail.teamAFouls || 0;
    const foulsB = matchData.footballDetail.teamBFouls || 0;

    const yellowA = events.filter((ev: any) => ev.teamId === matchData.teamAId && ev.eventType === "YELLOW_CARD").length;
    const yellowB = events.filter((ev: any) => ev.teamId === matchData.teamBId && ev.eventType === "YELLOW_CARD").length;

    const redA = events.filter((ev: any) => ev.teamId === matchData.teamAId && ev.eventType === "RED_CARD").length;
    const redB = events.filter((ev: any) => ev.teamId === matchData.teamBId && ev.eventType === "RED_CARD").length;

    const subsA = events.filter((ev: any) => ev.teamId === matchData.teamAId && ev.eventType === "SUBSTITUTION").length;
    const subsB = events.filter((ev: any) => ev.teamId === matchData.teamBId && ev.eventType === "SUBSTITUTION").length;

    return [
      { label: "Goals Scored", valA: goalsA, valB: goalsB },
      { label: "Corner Kicks", valA: cornersA, valB: cornersB },
      { label: "Fouls Committed", valA: foulsA, valB: foulsB },
      { label: "Yellow Cards", valA: yellowA, valB: yellowB },
      { label: "Red Cards", valA: redA, valB: redB },
      { label: "Substitutions", valA: subsA, valB: subsB },
    ];
  };

  const footballStats = !isCricket ? getFootballStats() : [];
  const footballPhase = !isCricket ? getFootballPhaseBadge() : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] pb-20">
      
      {/* Top Header */}
      <header className="bg-white border-b border-[#EFE8DC] sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/tournaments/${matchData.tournament.slug}`}
              className="p-2 rounded-xl text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#FAF7F2] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                  {matchData.tournament.sport}
                </span>
                <span className="text-xs font-black text-[#2C221E]">
                  Match #{matchData.matchNumber} · {matchData.stage?.replace("_", " ")} {matchData.group ? `· ${matchData.group.name}` : ""}
                </span>
              </div>
              <p className="text-[11px] text-[#7C6E63]">
                {matchData.tournament.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStoryModal(true)}
              className="border-[#D8C7B3] text-[#7C6E63] hover:text-[#2C221E] text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F59F00]" />
              <span>📸 Share Story</span>
            </Button>

            {isScorer && (
              <Link to={`/matches/${matchData.id}/score`}>
                <Button className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-bold h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>⚙️ Scorer Console</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* HERO LIVE MATCH SCORE CARD */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

          {/* Status & Venue Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7C6E63]">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin className="w-4 h-4 text-[#9E2A2B]" />
              <span>{matchData.venue || "CU CSE Grounds"}</span>
            </span>

            <div className="flex items-center gap-2">
              {matchData.startTime && (
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  <span>{new Date(matchData.startTime).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              )}

              {/* Dynamic Phase Status Badge */}
              {!isCricket && footballPhase ? (
                <span className={`font-black text-xs px-3 py-1 rounded-full uppercase border ${footballPhase.color}`}>
                  {footballPhase.text}
                </span>
              ) : (
                <span className={`font-black text-xs px-3 py-1 rounded-full uppercase ${
                  matchData.status === "LIVE" ? "bg-[#FFF5F5] text-[#C92A2A] animate-pulse border border-[#FF8787]" :
                  matchData.status === "COMPLETED" ? "bg-[#E6FCF5] text-[#0CA678] border border-[#20C997]" :
                  "bg-[#FAF0E6] text-[#842021]"
                }`}>
                  {matchData.status === "LIVE" ? "🔴 LIVE NOW" : matchData.status}
                </span>
              )}
            </div>
          </div>

          {/* Big Match Teams Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch py-2">
            
            {/* Team A Card */}
            <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-3 transition-all ${
              matchData.winnerTeamId === matchData.teamAId
                ? "bg-[#E6FCF5] border-[#20C997]"
                : "bg-[#FAF7F2] border-[#E8DCCF]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center font-black text-base shadow-xs">
                    {matchData.teamA.shortName || matchData.teamA.name.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-[#2C221E] flex items-center gap-1.5">
                      <span>{matchData.teamA.name}</span>
                      {matchData.winnerTeamId === matchData.teamAId && <span className="text-sm">👑</span>}
                    </h2>
                    <div className="mt-0.5">
                      {matchData.teamA.batch ? (
                        <BatchChip
                          name={matchData.teamA.batch.name}
                          session={matchData.teamA.batch.session}
                          slug={matchData.teamA.batch.slug}
                          avatarUrl={matchData.teamA.batch.avatarUrl}
                          batchNumber={matchData.teamA.batch.batchNumber}
                          size="xs"
                          variant="inline"
                          className="text-xs text-[#7C6E63]"
                        />
                      ) : (
                        <span className="text-xs text-[#7C6E63]">CU CSE Squad</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score summary */}
                <div className="text-right">
                  {isCricket ? (
                    <div>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-[#2C221E]">
                        {innings1?.battingTeamId === matchData.teamAId ? `${innings1.totalRuns}/${innings1.totalWickets}` :
                         innings2?.battingTeamId === matchData.teamAId ? `${innings2.totalRuns}/${innings2.totalWickets}` : "-"}
                      </span>
                      <p className="text-[11px] text-[#7C6E63] font-bold">
                        {innings1?.battingTeamId === matchData.teamAId ? `(${innings1.totalOvers} ov)` :
                         innings2?.battingTeamId === matchData.teamAId ? `(${innings2.totalOvers} ov)` : ""}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="font-mono text-3xl sm:text-4xl font-black text-[#9E2A2B]">
                        {matchData.footballDetail?.teamAScore || 0}
                      </span>
                      {matchData.footballDetail?.teamAPenaltyScore !== null && matchData.footballDetail?.teamAPenaltyScore !== undefined && (
                        <span className="block font-mono text-xs font-black text-[#2A7B54]">
                          ({matchData.footballDetail.teamAPenaltyScore} pens)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Football Goalscorers (Team A) */}
              {!isCricket && teamAGoalscorers.length > 0 && (
                <div className="pt-2 border-t border-[#EFE8DC]/90 flex flex-wrap items-center gap-1.5 text-[11px] text-[#2C221E]">
                  {teamAGoalscorers.map((g: any) => (
                    <span key={g.id} className="bg-white/90 px-2 py-0.5 rounded-lg border border-[#E8DCCF]/60 flex items-center gap-1">
                      <span>⚽</span>
                      <PlayerChip
                        name={g.playerName}
                        studentId={g.playerStudentId}
                        avatarUrl={g.playerAvatarUrl}
                        size="xs"
                      />
                      <span className="text-[#7C6E63] font-mono font-bold">{g.minute}'</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Team B Card */}
            <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-3 transition-all ${
              matchData.winnerTeamId === matchData.teamBId
                ? "bg-[#E6FCF5] border-[#20C997]"
                : "bg-[#FAF7F2] border-[#E8DCCF]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center font-black text-base shadow-xs">
                    {matchData.teamB.shortName || matchData.teamB.name.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-[#2C221E] flex items-center gap-1.5">
                      <span>{matchData.teamB.name}</span>
                      {matchData.winnerTeamId === matchData.teamBId && <span className="text-sm">👑</span>}
                    </h2>
                    <div className="mt-0.5">
                      {matchData.teamB.batch ? (
                        <BatchChip
                          name={matchData.teamB.batch.name}
                          session={matchData.teamB.batch.session}
                          slug={matchData.teamB.batch.slug}
                          avatarUrl={matchData.teamB.batch.avatarUrl}
                          batchNumber={matchData.teamB.batch.batchNumber}
                          size="xs"
                          variant="inline"
                          className="text-xs text-[#7C6E63]"
                        />
                      ) : (
                        <span className="text-xs text-[#7C6E63]">CU CSE Squad</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score summary */}
                <div className="text-right">
                  {isCricket ? (
                    <div>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-[#2C221E]">
                        {innings1?.battingTeamId === matchData.teamBId ? `${innings1.totalRuns}/${innings1.totalWickets}` :
                         innings2?.battingTeamId === matchData.teamBId ? `${innings2.totalRuns}/${innings2.totalWickets}` : "-"}
                      </span>
                      <p className="text-[11px] text-[#7C6E63] font-bold">
                        {innings1?.battingTeamId === matchData.teamBId ? `(${innings1.totalOvers} ov)` :
                         innings2?.battingTeamId === matchData.teamBId ? `(${innings2.totalOvers} ov)` : ""}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="font-mono text-3xl sm:text-4xl font-black text-[#9E2A2B]">
                        {matchData.footballDetail?.teamBScore || 0}
                      </span>
                      {matchData.footballDetail?.teamBPenaltyScore !== null && matchData.footballDetail?.teamBPenaltyScore !== undefined && (
                        <span className="block font-mono text-xs font-black text-[#2A7B54]">
                          ({matchData.footballDetail.teamBPenaltyScore} pens)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Football Goalscorers (Team B) */}
              {!isCricket && teamBGoalscorers.length > 0 && (
                <div className="pt-2 border-t border-[#EFE8DC]/90 flex flex-wrap items-center gap-1.5 text-[11px] text-[#2C221E]">
                  {teamBGoalscorers.map((g: any) => (
                    <span key={g.id} className="bg-white/90 px-2 py-0.5 rounded-lg border border-[#E8DCCF]/60 flex items-center gap-1">
                      <span>⚽</span>
                      <PlayerChip
                        name={g.playerName}
                        studentId={g.playerStudentId}
                        avatarUrl={g.playerAvatarUrl}
                        size="xs"
                      />
                      <span className="text-[#7C6E63] font-mono font-bold">{g.minute}'</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* DEDICATED PENALTY SHOOTOUT ARENA CARD */}
          {!isCricket && (matchData.footballDetail?.currentHalf === 5 || matchData.footballDetail?.teamAPenaltyScore !== null) && (
            <div className="bg-linear-to-r from-[#FAF0E6] via-[#FFF5F5] to-[#FAF0E6] rounded-2xl border-2 border-[#9E2A2B]/30 p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥅⚽</span>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-[#2C221E]">
                      {matchData.status === "LIVE" ? "🔴 Live Knockout Penalty Shootout" : "Championship Penalty Shootout Result"}
                    </h3>
                    <p className="text-[11px] text-[#7C6E63]">
                      {matchData.status === "LIVE" ? "Full Time ended in a draw · Kicks in progress" : "Official tiebreaker penalty scoreline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-mono text-xl sm:text-2xl font-black text-[#9E2A2B] bg-white px-4 py-1 rounded-xl border border-[#E8D6C3] shadow-xs">
                    {matchData.footballDetail?.teamAPenaltyScore || 0} - {matchData.footballDetail?.teamBPenaltyScore || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRICKET 2ND INNINGS TARGET & LIVE CHASE EQUATION BAR */}
          {isCricket && innings2 && innings1 && matchData.status === "LIVE" && (
            <div className="bg-linear-to-r from-[#FAF0E6] via-[#FFF5F5] to-[#FAF0E6] rounded-2xl border-2 border-[#9E2A2B]/30 p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-[#2C221E]">
                      Chase Target: <strong className="text-[#9E2A2B]">{innings1.totalRuns + 1} runs</strong>
                    </h3>
                    <p className="text-[11px] font-bold text-[#7C6E63]">
                      {innings2.battingTeamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name} needs{" "}
                      <span className="text-[#9E2A2B] font-black">{Math.max(0, (innings1.totalRuns + 1) - (innings2.totalRuns || 0))} runs</span> from{" "}
                      <span className="text-[#2C221E] font-black">{Math.max(0, (matchData.tournament?.rules?.maxOversPerInnings || 10) * 6 - (innings2.balls?.filter((b: any) => b.extraType !== "WIDE" && b.extraType !== "NO_BALL").length || 0))} balls</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E8D6C3] text-center shadow-xs">
                    <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">RRR</span>
                    <span className="font-mono font-black text-[#9E2A2B]">
                      {(() => {
                        const maxOvers = matchData.tournament?.rules?.maxOversPerInnings || 10;
                        const legalBalls = (innings2.balls || []).filter((b: any) => b.extraType !== "WIDE" && b.extraType !== "NO_BALL").length;
                        const ballsLeft = Math.max(0, maxOvers * 6 - legalBalls);
                        const needed = Math.max(0, (innings1.totalRuns + 1) - (innings2.totalRuns || 0));
                        return ballsLeft > 0 ? (needed / (ballsLeft / 6)).toFixed(2) : "0.00";
                      })()}
                    </span>
                  </div>

                  <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E8D6C3] text-center shadow-xs">
                    <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">CRR</span>
                    <span className="font-mono font-black text-[#2C221E]">
                      {innings2.totalOvers > 0 ? (innings2.totalRuns / innings2.totalOvers).toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E8D6C3] text-center shadow-xs">
                    <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">Wickets In Hand</span>
                    <span className="font-mono font-black text-[#2A7B54]">
                      {Math.max(0, 10 - (innings2.totalWickets || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Note or Toss Outcome */}
          <div className="pt-3 border-t border-[#EFE8DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {matchData.resultSummary ? (
              <div className="font-black text-sm text-[#842021] bg-[#FAF0E6] px-4 py-2 rounded-2xl border border-[#E8D6C3] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#9E2A2B]" />
                <span>{matchData.resultSummary}</span>
              </div>
            ) : matchData.tossWinnerTeamId ? (
              <p className="text-xs font-bold text-[#4A3E35]">
                🪙 {matchData.tossWinnerTeamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name} won the toss and elected to {matchData.tossDecision?.toLowerCase()} first.
              </p>
            ) : (
              <p className="text-xs text-[#7C6E63] italic">Toss not conducted yet.</p>
            )}

            {matchData.playerOfTheMatch && (
              <div className="flex items-center gap-1.5 bg-[#FFF9DB] text-[#7E4D00] px-3 py-1.5 rounded-xl border border-[#F59F00] font-bold">
                <Award className="w-4 h-4" />
                <span>POTM: <strong>{matchData.playerOfTheMatch.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-[#E5DACB] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("commentary")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "commentary"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Commentary & Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "analytics"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            {isCricket ? <Sparkles className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
            <span>{isCricket ? "📊 Live Analytics & Graphs" : "📊 Match Stats & Numbers"}</span>
          </button>

          <button
            onClick={() => setActiveTab("scorecard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "scorecard"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Full Scorecard</span>
          </button>

          <button
            onClick={() => setActiveTab("lineups")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "lineups"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Squads & Playing XI</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "info"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Match Info</span>
          </button>

          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "gallery"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Match Photos & Highlights</span>
          </button>
        </div>

        {/* TAB 1: COMMENTARY & TIMELINE */}
        {activeTab === "commentary" && (
          <div className="space-y-4">
            {isCricket ? (
              <div className="space-y-3">
                {matchData.cricketInnings?.map((inn: any) => (
                  <div key={inn.id} className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <h3 className="font-extrabold text-sm text-[#9E2A2B]">
                        Innings #{inn.inningsNumber}: {inn.battingTeamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name} ({inn.totalRuns}/{inn.totalWickets})
                      </h3>
                      <span className="font-mono text-xs font-bold text-[#7C6E63]">{inn.totalOvers} Overs</span>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto pr-1.5 space-y-2 custom-scrollbar">
                      {inn.balls?.slice().reverse().map((b: any) => (
                        <div key={b.id} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border shadow-xs bg-white text-[#2C221E]">
                              {b.overNumber}.{b.ballNumber}
                            </span>
                            <div>
                              <p className="font-bold text-[#2C221E]">
                                {b.bowler?.name} to {b.striker?.name}
                              </p>
                              <p className="text-[11px] text-[#7C6E63]">
                                {b.isWicket ? `💥 OUT! (${b.wicketType})` :
                                 b.runsBat === 4 ? "FOUR! 🏏" :
                                 b.runsBat === 6 ? "SIX! 🚀" :
                                 b.extraType === "WIDE" ? "Wide delivery" :
                                 b.extraType === "NO_BALL" ? "No ball" : `${b.runsBat} run(s)`}
                              </p>
                            </div>
                          </div>

                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                            b.isWicket ? "bg-[#C92A2A] text-white" :
                            b.runsBat === 4 || b.runsBat === 6 ? "bg-[#2A7B54] text-white" :
                            "bg-[#FAF0E6] text-[#842021]"
                          }`}>
                            {b.isWicket ? "W" : b.runsBat}
                          </span>
                        </div>
                      ))}

                      {(!inn.balls || inn.balls.length === 0) && (
                        <p className="text-xs text-[#A89A8D] italic text-center py-4">No ball commentary available yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Football Event Timeline */
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                  <h3 className="font-extrabold text-sm text-[#9E2A2B]">Match Timeline & Key Events</h3>
                  <span className="text-xs text-[#7C6E63] font-mono">{matchData.footballEvents?.length || 0} Events Logged</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
                  {matchData.footballEvents?.map((ev: any) => (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        ev.eventType === "GOAL"
                          ? "bg-[#E6FCF5] border-[#20C997]/60 shadow-xs"
                          : ev.eventType === "RED_CARD"
                          ? "bg-[#FFF5F5] border-[#FF8787]/60 shadow-xs"
                          : ev.eventType === "YELLOW_CARD"
                          ? "bg-[#FFF9DB] border-[#FFE066]/60"
                          : "bg-[#FAF7F2] border-[#E8DCCF]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-xl border ${
                          ev.eventType === "GOAL"
                            ? "bg-[#20C997] text-white border-[#0CA678]"
                            : ev.eventType === "RED_CARD"
                            ? "bg-[#FA5252] text-white border-[#E03131]"
                            : ev.eventType === "YELLOW_CARD"
                            ? "bg-[#FCC419] text-[#2C221E] border-[#FAB005]"
                            : "bg-[#FAF0E6] text-[#842021] border-[#E8D6C3]"
                        }`}>
                          {ev.minute}'
                        </span>

                        {ev.eventType === "SUBSTITUTION" ? (
                          <div className="space-y-1">
                            <div className="font-bold text-[#2C221E] flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-[#1864AB]">🔄 Sub:</span>
                              <div className="flex items-center gap-1 text-[#2A7B54]">
                                <PlayerChip
                                  name={ev.primaryPlayer?.name || "Player"}
                                  studentId={ev.primaryPlayer?.studentId}
                                  avatarUrl={ev.primaryPlayer?.avatarUrl}
                                  size="xs"
                                />
                                <span className="font-bold text-[10px] bg-[#E6FCF5] px-1.5 py-0.5 rounded text-[#0CA678] uppercase font-mono">ON</span>
                              </div>
                              {ev.secondaryPlayer && (
                                <div className="flex items-center gap-1 text-[#C92A2A]">
                                  <PlayerChip
                                    name={ev.secondaryPlayer?.name || "Player"}
                                    studentId={ev.secondaryPlayer?.studentId}
                                    avatarUrl={ev.secondaryPlayer?.avatarUrl}
                                    size="xs"
                                  />
                                  <span className="font-bold text-[10px] bg-[#FFF5F5] px-1.5 py-0.5 rounded text-[#C92A2A] uppercase font-mono">OFF</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-[#7C6E63]">{ev.teamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-[#2C221E] flex items-center gap-2 flex-wrap">
                              <span className="font-black text-xs">
                                {ev.eventType === "GOAL" ? "⚽ GOAL!" : ev.eventType === "YELLOW_CARD" ? "🟨 Yellow Card" : "🟥 Red Card (Sent Off)"}
                              </span>
                              <PlayerChip
                                name={ev.primaryPlayer?.name || "Player"}
                                studentId={ev.primaryPlayer?.studentId}
                                avatarUrl={ev.primaryPlayer?.avatarUrl}
                                size="xs"
                              />
                              {ev.description && (
                                <span className="text-[10px] font-bold bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded-full border border-[#E8D6C3]">
                                  {ev.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#7C6E63]">
                              <span className="font-semibold">{ev.teamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name}</span>
                              {ev.secondaryPlayer && (
                                <span className="flex items-center gap-1">
                                  <span>· Assist:</span>
                                  <PlayerChip
                                    name={ev.secondaryPlayer?.name}
                                    studentId={ev.secondaryPlayer?.studentId}
                                    avatarUrl={ev.secondaryPlayer?.avatarUrl}
                                    size="xs"
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-wider text-[#7C6E63] hidden sm:inline">
                        {ev.teamId === matchData.teamAId ? matchData.teamA.shortName : matchData.teamB.shortName}
                      </span>
                    </div>
                  ))}

                  {(!matchData.footballEvents || matchData.footballEvents.length === 0) && (
                    <p className="text-xs text-[#A89A8D] italic text-center py-8">No match events logged yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS (Cricket) & MATCH STATS (Football) */}
        {activeTab === "analytics" && (
          <div>
            {isCricket ? (
              <CricketLiveAnalytics match={matchData} />
            ) : (
              /* Football Head-to-Head Comparison Statistics */
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DC]">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-[#9E2A2B]" />
                    <h3 className="font-black text-sm sm:text-base text-[#2C221E]">
                      Match Statistics & Head-to-Head
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black">
                    <span className="text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                      {matchData.teamA.shortName || matchData.teamA.name}
                    </span>
                    <span className="text-[#7C6E63]">vs</span>
                    <span className="text-[#2C221E] bg-[#F1F3F5] px-2.5 py-1 rounded-xl border border-[#CED4DA]">
                      {matchData.teamB.shortName || matchData.teamB.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-5">
                  {footballStats.map((st: any, idx: number) => {
                    const total = st.valA + st.valB;
                    const pctA = total === 0 ? 50 : Math.round((st.valA / total) * 100);
                    const pctB = total === 0 ? 50 : 100 - pctA;
                    return (
                      <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCF]/70">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-black text-sm sm:text-base text-[#9E2A2B]">{st.valA}</span>
                          <span className="text-[#4A3E35] font-black text-xs uppercase tracking-wider">{st.label}</span>
                          <span className="font-mono font-black text-sm sm:text-base text-[#2C221E]">{st.valB}</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#E5DACB]/50 rounded-full overflow-hidden flex shadow-inner">
                          <div style={{ width: `${pctA}%` }} className="bg-[#9E2A2B] h-full transition-all duration-700" />
                          <div style={{ width: `${pctB}%` }} className="bg-[#495057] h-full transition-all duration-700" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FULL SCORECARD */}
        {activeTab === "scorecard" && (
          <div className="space-y-6">
            {isCricket ? (
              <div className="space-y-6">
                {matchData.cricketInnings?.map((inn: any) => (
                  <div key={inn.id} className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <h3 className="font-black text-sm text-[#9E2A2B]">
                        Innings {inn.inningsNumber}: {inn.battingTeamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name}
                      </h3>
                      <span className="font-mono text-sm font-black text-[#2C221E]">{inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)</span>
                    </div>

                    {/* Batting Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#EFE8DC] text-[#7C6E63] uppercase text-[10px] font-extrabold">
                            <th className="py-2 px-3">Batter</th>
                            <th className="py-2 px-3">Dismissal</th>
                            <th className="py-2 px-2 text-right">R</th>
                            <th className="py-2 px-2 text-right">B</th>
                            <th className="py-2 px-2 text-right">4s</th>
                            <th className="py-2 px-2 text-right">6s</th>
                            <th className="py-2 px-3 text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FAF0E6]">
                          {inn.battingScorecards?.map((b: any) => (
                            <tr key={b.id} className="hover:bg-[#FAF7F2]">
                              <td className="py-2.5 px-3 font-bold text-[#2C221E]">
                                <PlayerChip
                                  name={b.player?.name || "Batter"}
                                  studentId={b.player?.studentId}
                                  avatarUrl={b.player?.avatarUrl}
                                  size="xs"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-[#7C6E63]">
                                {b.isOut ? `${b.wicketType?.replace("_", " ")} ${b.bowlerName ? `b ${b.bowlerName}` : ""}` : "not out"}
                              </td>
                              <td className="py-2.5 px-2 text-right font-black text-[#2C221E]">{b.runs}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-[#7C6E63]">{b.balls}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-[#7C6E63]">{b.fours}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-[#7C6E63]">{b.sixes}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bowling Table */}
                    <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-[#7C6E63] tracking-wider">Bowling</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#EFE8DC] text-[#7C6E63] uppercase text-[10px] font-extrabold">
                              <th className="py-2 px-3">Bowler</th>
                              <th className="py-2 px-2 text-right">O</th>
                              <th className="py-2 px-2 text-right">M</th>
                              <th className="py-2 px-2 text-right">R</th>
                              <th className="py-2 px-2 text-right">W</th>
                              <th className="py-2 px-3 text-right">Econ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#FAF0E6]">
                            {inn.bowlingScorecards?.map((bw: any) => (
                              <tr key={bw.id} className="hover:bg-[#FAF7F2]">
                                <td className="py-2.5 px-3 font-bold text-[#2C221E]">
                                  <PlayerChip
                                    name={bw.player?.name || "Bowler"}
                                    studentId={bw.player?.studentId}
                                    avatarUrl={bw.player?.avatarUrl}
                                    size="xs"
                                  />
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold">{bw.overs}</td>
                                <td className="py-2.5 px-2 text-right font-bold">{bw.maidens}</td>
                                <td className="py-2.5 px-2 text-right font-bold">{bw.runs}</td>
                                <td className="py-2.5 px-2 text-right font-black text-[#9E2A2B]">{bw.wickets}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold">
                                  {bw.overs > 0 ? (bw.runs / Math.max(1, Math.floor(bw.overs) + (bw.overs % 1) * (10 / 6))).toFixed(2) : "0.00"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              /* Football Scorecard Summary */
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-[#9E2A2B]">Match Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border">
                    <p className="text-xs font-bold text-[#7C6E63]">{matchData.teamA.name}</p>
                    <p className="text-3xl font-black text-[#9E2A2B] mt-1">{matchData.footballDetail?.teamAScore || 0}</p>
                    {matchData.footballDetail?.teamAPenaltyScore !== null && matchData.footballDetail?.teamAPenaltyScore !== undefined && (
                      <span className="text-xs font-bold text-[#2A7B54]">({matchData.footballDetail.teamAPenaltyScore} pens)</span>
                    )}
                  </div>
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border">
                    <p className="text-xs font-bold text-[#7C6E63]">{matchData.teamB.name}</p>
                    <p className="text-3xl font-black text-[#9E2A2B] mt-1">{matchData.footballDetail?.teamBScore || 0}</p>
                    {matchData.footballDetail?.teamBPenaltyScore !== null && matchData.footballDetail?.teamBPenaltyScore !== undefined && (
                      <span className="text-xs font-bold text-[#2A7B54]">({matchData.footballDetail.teamBPenaltyScore} pens)</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SQUADS & PLAYING XI (On-Pitch XI & Subbed Players Only) */}
        {activeTab === "lineups" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Team A Squad */}
            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div>
                  <h3 className="font-black text-sm text-[#9E2A2B]">{matchData.teamA.name}</h3>
                  <p className="text-[11px] text-[#7C6E63]">
                    {matchData.teamA.batch ? matchData.teamA.batch.name : "CU CSE"} · {teamASquad.onPitch.length} on Pitch
                    {teamASquad.subbedOut.length > 0 && ` · ${teamASquad.subbedOut.length} Subbed`}
                  </p>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                  {isCricket ? `${teamASquad.onPitch.length} Playing XI` : `${teamASquad.totalInMatch} in Match`}
                </span>
              </div>

              {/* Active On Pitch */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-black text-[#2A7B54] uppercase tracking-wide px-1">
                  <span>🟢 {isCricket ? "Playing XI" : "Active Starting XI (On Pitch)"}</span>
                  <span>{teamASquad.onPitch.length} Players</span>
                </div>

                {teamASquad.onPitch.map((p: any) => (
                  <div key={p.userId} className="p-2.5 bg-[#FAF7F2] rounded-xl flex items-center justify-between text-xs border border-[#E8DCCF]/60">
                    <div className="flex items-center gap-2">
                      <PlayerChip
                        name={p.user?.name || "Player"}
                        studentId={p.user?.studentId}
                        avatarUrl={p.user?.avatarUrl}
                        size="xs"
                      />
                      {p.subbedIn && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E7F5FF] text-[#1864AB] border border-[#339AF0]/30">
                          🔄 Sub IN ({p.subbedIn.minute}')
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[#7C6E63]">{p.user?.studentId}</span>
                  </div>
                ))}
              </div>

              {/* Substituted Off (Football) */}
              {teamASquad.subbedOut.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#EFE8DC]">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#C92A2A] uppercase tracking-wide px-1">
                    <span>🔄 Substituted Off</span>
                    <span>{teamASquad.subbedOut.length} Players</span>
                  </div>

                  {teamASquad.subbedOut.map((p: any) => (
                    <div key={p.userId} className="p-2.5 bg-[#FFF5F5] rounded-xl flex items-center justify-between text-xs border border-[#FFC9C9]">
                      <div className="flex items-center gap-2">
                        <PlayerChip
                          name={p.user?.name || "Player"}
                          studentId={p.user?.studentId}
                          avatarUrl={p.user?.avatarUrl}
                          size="xs"
                          className="opacity-60 line-through"
                        />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE3E3] text-[#C92A2A] border border-[#FFA8A8]">
                          Sub OUT ({p.subbedOut?.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#868E96]">{p.user?.studentId}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent Off / Red Card (Football) */}
              {teamASquad.sentOff && teamASquad.sentOff.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#EFE8DC]">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#C92A2A] uppercase tracking-wide px-1">
                    <span>🟥 Sent Off (Red Card)</span>
                    <span>{teamASquad.sentOff.length} Dismissed</span>
                  </div>

                  {teamASquad.sentOff.map((p: any) => (
                    <div key={p.userId} className="p-2.5 bg-[#FFE3E3] rounded-xl flex items-center justify-between text-xs border border-[#FF8787]">
                      <div className="flex items-center gap-2">
                        <PlayerChip
                          name={p.user?.name || "Player"}
                          studentId={p.user?.studentId}
                          avatarUrl={p.user?.avatarUrl}
                          size="xs"
                        />
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C92A2A] text-white">
                          🟥 Red Card ({p.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#C92A2A] font-bold">{p.user?.studentId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team B Squad */}
            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div>
                  <h3 className="font-black text-sm text-[#9E2A2B]">{matchData.teamB.name}</h3>
                  <p className="text-[11px] text-[#7C6E63]">
                    {matchData.teamB.batch ? matchData.teamB.batch.name : "CU CSE"} · {teamBSquad.onPitch.length} on Pitch
                    {teamBSquad.subbedOut.length > 0 && ` · ${teamBSquad.subbedOut.length} Subbed`}
                    {teamBSquad.sentOff && teamBSquad.sentOff.length > 0 && ` · ${teamBSquad.sentOff.length} Red Card`}
                  </p>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                  {isCricket ? `${teamBSquad.onPitch.length} Playing XI` : `${teamBSquad.totalInMatch} in Match`}
                </span>
              </div>

              {/* Active On Pitch */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-black text-[#2A7B54] uppercase tracking-wide px-1">
                  <span>🟢 {isCricket ? "Playing XI" : "Active Starting XI (On Pitch)"}</span>
                  <span>{teamBSquad.onPitch.length} Players</span>
                </div>

                {teamBSquad.onPitch.map((p: any) => (
                  <div key={p.userId} className="p-2.5 bg-[#FAF7F2] rounded-xl flex items-center justify-between text-xs border border-[#E8DCCF]/60">
                    <div className="flex items-center gap-2">
                      <PlayerChip
                        name={p.user?.name || "Player"}
                        studentId={p.user?.studentId}
                        avatarUrl={p.user?.avatarUrl}
                        size="xs"
                      />
                      {p.subbedIn && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E7F5FF] text-[#1864AB] border border-[#339AF0]/30">
                          🔄 Sub IN ({p.subbedIn.minute}')
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[#7C6E63]">{p.user?.studentId}</span>
                  </div>
                ))}
              </div>

              {/* Substituted Off (Football) */}
              {teamBSquad.subbedOut.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#EFE8DC]">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#C92A2A] uppercase tracking-wide px-1">
                    <span>🔄 Substituted Off</span>
                    <span>{teamBSquad.subbedOut.length} Players</span>
                  </div>

                  {teamBSquad.subbedOut.map((p: any) => (
                    <div key={p.userId} className="p-2.5 bg-[#FFF5F5] rounded-xl flex items-center justify-between text-xs border border-[#FFC9C9]">
                      <div className="flex items-center gap-2">
                        <PlayerChip
                          name={p.user?.name || "Player"}
                          studentId={p.user?.studentId}
                          avatarUrl={p.user?.avatarUrl}
                          size="xs"
                          className="opacity-60 line-through"
                        />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE3E3] text-[#C92A2A] border border-[#FFA8A8]">
                          Sub OUT ({p.subbedOut?.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#868E96]">{p.user?.studentId}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent Off / Red Card (Football) */}
              {teamBSquad.sentOff && teamBSquad.sentOff.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#EFE8DC]">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#C92A2A] uppercase tracking-wide px-1">
                    <span>🟥 Sent Off (Red Card)</span>
                    <span>{teamBSquad.sentOff.length} Dismissed</span>
                  </div>

                  {teamBSquad.sentOff.map((p: any) => (
                    <div key={p.userId} className="p-2.5 bg-[#FFE3E3] rounded-xl flex items-center justify-between text-xs border border-[#FF8787]">
                      <div className="flex items-center gap-2">
                        <PlayerChip
                          name={p.user?.name || "Player"}
                          studentId={p.user?.studentId}
                          avatarUrl={p.user?.avatarUrl}
                          size="xs"
                        />
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C92A2A] text-white">
                          🟥 Red Card ({p.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#C92A2A] font-bold">{p.user?.studentId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: LIVE ANALYTICS & GRAPHS */}
        {activeTab === "analytics" && isCricket && (
          <CricketLiveAnalytics match={matchData} />
        )}

        {/* TAB 4: MATCH INFO */}
        {activeTab === "info" && (
          <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-black text-sm text-[#9E2A2B]">Match Specifications</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border">
                <span className="font-bold text-[#7C6E63] block text-[11px]">🏟️ Venue:</span>
                <span className="font-extrabold text-[#2C221E]">{matchData.venue || "CU CSE Grounds"}</span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border">
                <span className="font-bold text-[#7C6E63] block text-[11px]">🏆 Tournament:</span>
                <span className="font-extrabold text-[#2C221E]">{matchData.tournament.name}</span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border">
                <span className="font-bold text-[#7C6E63] block text-[11px]">👥 Assigned Match Scorers:</span>
                <span className="font-extrabold text-[#2C221E]">
                  {matchData.scorers?.length > 0 ? matchData.scorers.map((s: any) => s.user.name).join(", ") : "Department Appointees"}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border">
                <span className="font-bold text-[#7C6E63] block text-[11px]">🪙 Toss Result:</span>
                <span className="font-extrabold text-[#2C221E]">
                  {matchData.tossWinnerTeamId ? `${matchData.tossWinnerTeamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name} (${matchData.tossDecision})` : "TBD"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MATCH PHOTOS & HIGHLIGHTS */}
        {activeTab === "gallery" && (
          <MediaGalleryView
            matchId={matchData.id}
            tournamentId={matchData.tournamentId}
            defaultCategory="MATCH_PHOTO"
            title={`Match #${matchData.matchNumber} Action & Moments`}
            description="Toss, goals/wickets celebrations, standout saves, and player of the match photos."
            allowUpload={true}
          />
        )}

      </main>

      {/* Social Match Story Card Modal */}
      <MatchStoryCardModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        match={matchData}
      />

    </div>
  );
};
