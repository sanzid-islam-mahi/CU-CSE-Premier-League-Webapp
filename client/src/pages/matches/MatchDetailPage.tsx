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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CricketLiveAnalytics } from "@/components/matches/CricketLiveAnalytics";
import { MatchStoryCardModal } from "@/components/matches/MatchStoryCardModal";

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [matchData, setMatchData] = useState<any>(null);
  const [isScorer, setIsScorer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"commentary" | "analytics" | "scorecard" | "lineups" | "info">("commentary");
  const [showStoryModal, setShowStoryModal] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
    const interval = setInterval(fetchMatchDetails, 5000); // 5-second live polling
    return () => clearInterval(interval);
  }, [matchId]);

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
        .filter((s: any) => s.isPlayingXI)
        .map((s: any) => ({
          userId: s.userId,
          user: s.user || team.members?.find((m: any) => m.userId === s.userId)?.user,
          subbedIn: subbedInMap.get(s.userId),
        }));

      const subbedOutSquad: any[] = squadEntries
        .filter((s: any) => !s.isPlayingXI && subbedOutMap.has(s.userId))
        .map((s: any) => ({
          userId: s.userId,
          user: s.user || team.members?.find((m: any) => m.userId === s.userId)?.user,
          subbedOut: subbedOutMap.get(s.userId),
        }));

      // In case an event has a secondaryPlayerId not explicitly in squadEntries
      subEvents.forEach((ev: any) => {
        if (ev.secondaryPlayerId && !subbedOutSquad.some((p: any) => p.userId === ev.secondaryPlayerId)) {
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

      return {
        onPitch: onPitchSquad,
        subbedOut: subbedOutSquad,
        totalInMatch: onPitchSquad.length + subbedOutSquad.length
      };
    }

    const fallbackOnPitch = (team.members || []).slice(0, 11).map((m: any) => ({
      userId: m.userId,
      user: m.user,
      subbedIn: undefined
    }));

    return {
      onPitch: fallbackOnPitch,
      subbedOut: [],
      totalInMatch: fallbackOnPitch.length
    };
  };

  const teamASquad = getTeamMatchSquad(matchData.teamAId);
  const teamBSquad = getTeamMatchSquad(matchData.teamBId);

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

              <span className={`font-black text-xs px-3 py-1 rounded-full uppercase ${
                matchData.status === "LIVE" ? "bg-[#FFF5F5] text-[#C92A2A] animate-pulse border border-[#FF8787]" :
                matchData.status === "COMPLETED" ? "bg-[#E6FCF5] text-[#0CA678] border border-[#20C997]" :
                "bg-[#FAF0E6] text-[#842021]"
              }`}>
                {matchData.status === "LIVE" ? "🔴 LIVE NOW" : matchData.status}
              </span>
            </div>
          </div>

          {/* Big Match Teams Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
            
            {/* Team A */}
            <div className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${
              matchData.winnerTeamId === matchData.teamAId
                ? "bg-[#E6FCF5] border-[#20C997]"
                : "bg-[#FAF7F2] border-[#E8DCCF]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center font-black text-base shadow-xs">
                  {matchData.teamA.shortName || matchData.teamA.name.slice(0, 2)}
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-[#2C221E] flex items-center gap-1.5">
                    <span>{matchData.teamA.name}</span>
                    {matchData.winnerTeamId === matchData.teamAId && <span className="text-sm">👑</span>}
                  </h2>
                  <p className="text-xs text-[#7C6E63]">{matchData.teamA.batch ? matchData.teamA.batch.name : "CU CSE"}</p>
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

            {/* Team B */}
            <div className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${
              matchData.winnerTeamId === matchData.teamBId
                ? "bg-[#E6FCF5] border-[#20C997]"
                : "bg-[#FAF7F2] border-[#E8DCCF]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center font-black text-base shadow-xs">
                  {matchData.teamB.shortName || matchData.teamB.name.slice(0, 2)}
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-[#2C221E] flex items-center gap-1.5">
                    <span>{matchData.teamB.name}</span>
                    {matchData.winnerTeamId === matchData.teamBId && <span className="text-sm">👑</span>}
                  </h2>
                  <p className="text-xs text-[#7C6E63]">{matchData.teamB.batch ? matchData.teamB.batch.name : "CU CSE"}</p>
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

          </div>

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

          {isCricket && (
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === "analytics"
                  ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                  : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>📊 Live Analytics & Graphs</span>
            </button>
          )}

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
                <h3 className="font-extrabold text-sm text-[#9E2A2B]">Match Event Stream</h3>
                <div className="max-h-[460px] overflow-y-auto pr-1.5 space-y-2 custom-scrollbar">
                  {matchData.footballEvents?.map((ev: any) => (
                    <div key={ev.id} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs bg-[#FAF0E6] px-2.5 py-1 rounded-xl text-[#842021] border border-[#E8D6C3]">
                          {ev.minute}'
                        </span>
                        {ev.eventType === "SUBSTITUTION" ? (
                          <div>
                            <p className="font-bold text-[#2C221E]">
                              🔄 Sub: <span className="text-[#2A7B54] font-black">{ev.primaryPlayer?.name} (IN)</span>
                              {ev.secondaryPlayer && <span className="text-[#C92A2A] font-semibold"> for {ev.secondaryPlayer.name} (OUT)</span>}
                            </p>
                            <p className="text-[11px] text-[#7C6E63]">{ev.teamId === matchData.teamAId ? matchData.teamA.name : matchData.teamB.name}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-[#2C221E]">
                              {ev.eventType === "GOAL" ? "⚽ Goal!" : ev.eventType === "YELLOW_CARD" ? "🟨 Yellow Card" : "🟥 Red Card"}
                              {" "}· <span className="text-[#9E2A2B]">{ev.primaryPlayer?.name}</span>
                            </p>
                            {ev.secondaryPlayer && (
                              <p className="text-[11px] text-[#7C6E63]">Assist by {ev.secondaryPlayer.name}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!matchData.footballEvents || matchData.footballEvents.length === 0) && (
                    <p className="text-xs text-[#A89A8D] italic text-center py-6">No match events logged yet.</p>
                  )}
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
                              <td className="py-2.5 px-3 font-bold text-[#2C221E]">{b.player?.name}</td>
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
                                <td className="py-2.5 px-3 font-bold text-[#2C221E]">{bw.player?.name}</td>
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
                      <span className="font-bold text-[#2C221E]">{p.user?.name}</span>
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
                        <span className="font-bold text-[#495057] line-through">{p.user?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE3E3] text-[#C92A2A] border border-[#FFA8A8]">
                          Sub OUT ({p.subbedOut?.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#868E96]">{p.user?.studentId}</span>
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
                      <span className="font-bold text-[#2C221E]">{p.user?.name}</span>
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
                        <span className="font-bold text-[#495057] line-through">{p.user?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE3E3] text-[#C92A2A] border border-[#FFA8A8]">
                          Sub OUT ({p.subbedOut?.minute}')
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#868E96]">{p.user?.studentId}</span>
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
