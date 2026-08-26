import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Play, 
  Pause, 
  Award,
  RefreshCw,
  Flame,
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CricketLiveAnalytics } from "@/components/matches/CricketLiveAnalytics";
import { MatchStoryCardModal } from "@/components/matches/MatchStoryCardModal";

export const LiveScorerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Active Innings (Cricket)
  const [activeInningsNumber, setActiveInningsNumber] = useState<1 | 2>(1);
  const [strikerId, setStrikerId] = useState<number | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<number | null>(null);
  const [currentBowlerId, setCurrentBowlerId] = useState<number | null>(null);

  // Cricket Wicket Modal
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<string>("CAUGHT");
  const [wicketPlayerOutId, setWicketPlayerOutId] = useState<number | "">("");
  const [wicketFielderId, setWicketFielderId] = useState<number | "">("");
  const [wicketNewBatterId, setWicketNewBatterId] = useState<number | "">("");

  // Change Bowler Modal
  const [showChangeBowlerModal, setShowChangeBowlerModal] = useState(false);
  const [nextBowlerSelection, setNextBowlerSelection] = useState<number | "">("");

  // Setup / Toss Modal
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState<number | "">("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">("BAT");
  const [selectedTeamAPlayers, setSelectedTeamAPlayers] = useState<number[]>([]);
  const [selectedTeamBPlayers, setSelectedTeamBPlayers] = useState<number[]>([]);

  // Complete Match Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [matchWinnerTeamId, setMatchWinnerTeamId] = useState<number | "">("");
  const [matchResultSummary, setMatchResultSummary] = useState("");
  const [matchPotmId, setMatchPotmId] = useState<number | "">("");

  // Football Timer & Event States
  const [footballTimerSeconds, setFootballTimerSeconds] = useState(0);
  const [isFootballTimerRunning, setIsFootballTimerRunning] = useState(false);
  const [footballCurrentHalf, setFootballCurrentHalf] = useState(1);
  const [showFootballEventModal, setShowFootballEventModal] = useState(false);
  const [footballEventType, setFootballEventType] = useState("GOAL");
  const [footballEventTeamId, setFootballEventTeamId] = useState<number | "">("");
  const [footballEventMinute, setFootballEventMinute] = useState<number>(1);
  const [footballEventPrimaryPlayerId, setFootballEventPrimaryPlayerId] = useState<number | "">("");
  const [footballEventSecondaryPlayerId, setFootballEventSecondaryPlayerId] = useState<number | "">("");

  // Football Substitution Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTeamId, setSubTeamId] = useState<number | "">("");
  const [subPlayerOutId, setSubPlayerOutId] = useState<number | "">("");
  const [subPlayerInId, setSubPlayerInId] = useState<number | "">("");
  const [subMinute, setSubMinute] = useState<number>(1);

  // Football Penalty Shootout Modal (Knockout tiebreaker)
  const [showPenaltyShootoutModal, setShowPenaltyShootoutModal] = useState(false);
  const [penScoreA, setPenScoreA] = useState<number>(0);
  const [penScoreB, setPenScoreB] = useState<number>(0);
  const [penWinnerId, setPenWinnerId] = useState<number | "">("");
  const [penPotmId, setPenPotmId] = useState<number | "">("");

  const timerRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    fetchMatchData(true);
  }, [matchId]);

  // Football Stopwatch Interval
  useEffect(() => {
    if (isFootballTimerRunning) {
      timerRef.current = setInterval(() => {
        setFootballTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFootballTimerRunning]);

  const fetchMatchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.scoring.getLive(matchId);
      const m = res.match;
      setMatchData(m);

      // Pre-fill toss & squad states if not set
      if (!m.tossWinnerTeamId && isInitial) {
        setTossWinnerTeamId(m.teamAId);
        setSelectedTeamAPlayers(m.teamA.members?.slice(0, 11).map((x: any) => x.userId) || []);
        setSelectedTeamBPlayers(m.teamB.members?.slice(0, 11).map((x: any) => x.userId) || []);
      }

      // Initialize Cricket Innings active batters/bowlers
      if (m.tournament.sport === "CRICKET") {
        const inn = m.cricketInnings?.find((x: any) => x.inningsNumber === activeInningsNumber) || m.cricketInnings?.[0];
        if (inn) {
          setActiveInningsNumber(inn.inningsNumber as 1 | 2);
          const batters = inn.battingScorecards?.filter((b: any) => !b.isOut) || [];
          if (batters.length > 0 && !strikerId) setStrikerId(batters[0]?.playerId);
          if (batters.length > 1 && !nonStrikerId) setNonStrikerId(batters[1]?.playerId);
          const lastBall = inn.balls?.[inn.balls.length - 1];
          if (lastBall && !currentBowlerId) setCurrentBowlerId(lastBall.bowlerId);
        }
      }

      // Initialize Football Stopwatch (Only on initial load or if timer is not actively running)
      if (m.tournament.sport === "FOOTBALL" && m.footballDetail) {
        if (isInitial || !isFootballTimerRunning) {
          setFootballTimerSeconds(m.footballDetail.clockSeconds || 0);
          setIsFootballTimerRunning(m.footballDetail.isClockRunning || false);
          setFootballCurrentHalf(m.footballDetail.currentHalf || 1);
        }
      }

    } catch (err: any) {
      setError(err.message || "Failed to load match scoring data.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // 1. Setup / Toss Handler
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.scoring.setupMatch(matchId, {
        tossWinnerTeamId: Number(tossWinnerTeamId),
        tossDecision,
        teamAPlayerIds: selectedTeamAPlayers,
        teamBPlayerIds: selectedTeamBPlayers,
      });
      triggerToast("Toss and Playing XI saved!");
      setShowSetupModal(false);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to save match setup.");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Cricket: Start Innings Handler
  const handleStartInnings = async (inningsNum: 1 | 2) => {
    if (!strikerId || !nonStrikerId || !currentBowlerId) {
      alert("Please select Striker, Non-Striker, and Opening Bowler.");
      return;
    }
    if (strikerId === nonStrikerId) {
      alert("Striker and Non-Striker cannot be the same player.");
      return;
    }

    const isBattingTeamA = (inningsNum === 1 && matchData.tossWinnerTeamId === matchData.teamAId && matchData.tossDecision === "BAT") ||
                           (inningsNum === 1 && matchData.tossWinnerTeamId === matchData.teamBId && matchData.tossDecision === "BOWL") ||
                           (inningsNum === 2 && matchData.tossWinnerTeamId === matchData.teamAId && matchData.tossDecision === "BOWL") ||
                           (inningsNum === 2 && matchData.tossWinnerTeamId === matchData.teamBId && matchData.tossDecision === "BAT");

    const battingTeamId = isBattingTeamA ? matchData.teamAId : matchData.teamBId;
    const bowlingTeamId = isBattingTeamA ? matchData.teamBId : matchData.teamAId;

    setActionLoading(true);
    try {
      await api.scoring.startInnings(matchId, {
        inningsNumber: inningsNum,
        battingTeamId,
        bowlingTeamId,
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(currentBowlerId),
      });
      triggerToast(`Innings #${inningsNum} started!`);
      setActiveInningsNumber(inningsNum);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to start innings.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Cricket: Record Ball Handler
  const handleRecordBall = async (runsBat: number, extraType = "NONE", extraRuns = 0) => {
    const currentInnings = matchData?.cricketInnings?.find((x: any) => x.inningsNumber === activeInningsNumber);
    if (!currentInnings) {
      alert("Please start the innings first.");
      return;
    }
    if (!strikerId || !nonStrikerId || !currentBowlerId) {
      alert("Please ensure Striker, Non-Striker, and Bowler are selected.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.scoring.recordBall(matchId, {
        inningsId: currentInnings.id,
        strikerId,
        nonStrikerId,
        bowlerId: currentBowlerId,
        runsBat,
        extraType,
        extraRuns,
      });

      setStrikerId(res.nextStrikerId);
      setNonStrikerId(res.nextNonStrikerId);

      if (res.isOverEnd) {
        triggerToast(`End of Over ${res.overNumber}! Choose next bowler.`);
        setShowChangeBowlerModal(true);
      }

      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to record ball delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cricket: Record Wicket Handler
  const handleRecordWicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInnings = matchData?.cricketInnings?.find((x: any) => x.inningsNumber === activeInningsNumber);
    if (!currentInnings || !strikerId || !nonStrikerId || !currentBowlerId) return;

    setActionLoading(true);
    try {
      const playerOut = wicketPlayerOutId ? Number(wicketPlayerOutId) : strikerId;
      const res = await api.scoring.recordBall(matchId, {
        inningsId: currentInnings.id,
        strikerId,
        nonStrikerId,
        bowlerId: currentBowlerId,
        runsBat: 0,
        extraType: "NONE",
        extraRuns: 0,
        isWicket: true,
        wicketType,
        playerOutId: playerOut,
        fielderId: wicketFielderId ? Number(wicketFielderId) : null,
        newBatterId: wicketNewBatterId ? Number(wicketNewBatterId) : null,
      });

      triggerToast(`Wicket (${wicketType}) recorded!`);
      setShowWicketModal(false);
      setWicketPlayerOutId("");
      setWicketFielderId("");
      setWicketNewBatterId("");

      setStrikerId(res.nextStrikerId);
      setNonStrikerId(res.nextNonStrikerId);

      if (res.isOverEnd) {
        setShowChangeBowlerModal(true);
      }

      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to record wicket.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Cricket: Undo Last Ball Handler
  const handleUndoBall = async () => {
    const currentInnings = matchData?.cricketInnings?.find((x: any) => x.inningsNumber === activeInningsNumber);
    if (!currentInnings) return;
    if (!confirm("Are you sure you want to undo the last delivery?")) return;

    setActionLoading(true);
    try {
      await api.scoring.undoBall(matchId, currentInnings.id);
      triggerToast("Last delivery undone.");
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to undo ball.");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Cricket: Change Bowler
  const handleChangeBowler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextBowlerSelection) return;
    setCurrentBowlerId(Number(nextBowlerSelection));
    setShowChangeBowlerModal(false);
    setNextBowlerSelection("");
    triggerToast("Bowler changed!");
  };

  // 7. Football: Lifecycle - Start 1st Half
  const handleStartFootballFirstHalf = async () => {
    setIsFootballTimerRunning(true);
    setFootballCurrentHalf(1);
    setFootballTimerSeconds(0);
    try {
      await api.scoring.updateFootballTimer(matchId, {
        clockSeconds: 0,
        isClockRunning: true,
        currentHalf: 1,
        status: "LIVE",
      });
      triggerToast("Match Started! 1st Half LIVE ▶");
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to start match.");
    }
  };

  // Football: Toggle Stopwatch Timer (Pause / Resume)
  const handleToggleFootballTimer = async () => {
    const nextRunning = !isFootballTimerRunning;
    setIsFootballTimerRunning(nextRunning);

    try {
      await api.scoring.updateFootballTimer(matchId, {
        clockSeconds: footballTimerSeconds,
        isClockRunning: nextRunning,
        currentHalf: footballCurrentHalf,
        status: nextRunning ? "LIVE" : "PAUSED",
      });
      triggerToast(nextRunning ? "Timer Resumed ▶" : "Timer Paused ⏸");
    } catch (err: any) {
      console.error(err);
    }
  };

  // Football: Lifecycle - Mark Half Time
  const handleMarkHalfTime = async () => {
    if (!confirm("Conclude 1st Half and mark Half-Time?")) return;
    setIsFootballTimerRunning(false);
    const halfDur = (matchData?.footballDetail?.halfDurationMinutes || 20) * 60;
    const finalHalfSeconds = Math.max(footballTimerSeconds, halfDur);
    setFootballTimerSeconds(finalHalfSeconds);
    try {
      await api.scoring.updateFootballTimer(matchId, {
        clockSeconds: finalHalfSeconds,
        isClockRunning: false,
        currentHalf: 1,
        status: "HALFTIME",
      });
      triggerToast("1st Half Concluded (HALFTIME ⏸)");
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to mark halftime.");
    }
  };

  // Football: Lifecycle - Start 2nd Half
  const handleStartFootballSecondHalf = async () => {
    const halfDur = (matchData?.footballDetail?.halfDurationMinutes || 20) * 60;
    const startSec = Math.max(footballTimerSeconds, halfDur);
    setFootballTimerSeconds(startSec);
    setIsFootballTimerRunning(true);
    setFootballCurrentHalf(2);
    try {
      await api.scoring.updateFootballTimer(matchId, {
        clockSeconds: startSec,
        isClockRunning: true,
        currentHalf: 2,
        status: "LIVE",
      });
      triggerToast("2nd Half Started! LIVE ▶");
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to start 2nd half.");
    }
  };

  // Football: Lifecycle - Mark Full Time
  const handleMarkFullTime = async () => {
    if (!confirm("Conclude 2nd Half and mark Full Time?")) return;
    setIsFootballTimerRunning(false);
    try {
      await api.scoring.updateFootballTimer(matchId, {
        clockSeconds: footballTimerSeconds,
        isClockRunning: false,
        currentHalf: 2,
        status: "COMPLETED",
      });

      const isKnockout = matchData.stage !== "GROUP_STAGE";
      const isTied = (matchData.footballDetail?.teamAScore || 0) === (matchData.footballDetail?.teamBScore || 0);

      if (isKnockout && isTied) {
        setPenScoreA(0);
        setPenScoreB(0);
        setShowPenaltyShootoutModal(true);
      } else {
        setShowCompleteModal(true);
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark full time.");
    }
  };

  // Football Helpers: Get players currently on the field vs bench
  const getOnFieldPlayers = (teamId: number) => {
    if (!matchData) return [];
    const team = teamId === matchData.teamAId ? matchData.teamA : matchData.teamB;
    if (!team || !team.members) return [];

    const squadForTeam = matchData.matchSquads?.filter((s: any) => s.teamId === teamId) || [];
    if (squadForTeam.length > 0) {
      const onFieldUserIds = new Set(
        squadForTeam.filter((s: any) => s.isPlayingXI).map((s: any) => s.userId)
      );
      return team.members.filter((m: any) => onFieldUserIds.has(m.userId));
    }
    // Default fallback if lineup wasn't explicitly saved before starting: first 11
    return team.members.slice(0, 11);
  };

  const getBenchPlayers = (teamId: number) => {
    if (!matchData) return [];
    const team = teamId === matchData.teamAId ? matchData.teamA : matchData.teamB;
    if (!team || !team.members) return [];

    const squadForTeam = matchData.matchSquads?.filter((s: any) => s.teamId === teamId) || [];
    if (squadForTeam.length > 0) {
      const onFieldUserIds = new Set(
        squadForTeam.filter((s: any) => s.isPlayingXI).map((s: any) => s.userId)
      );
      return team.members.filter((m: any) => !onFieldUserIds.has(m.userId));
    }
    // Default fallback if lineup wasn't explicitly saved: members beyond first 11
    return team.members.slice(11);
  };

  // 8. Football: Open Event Modal (Auto-captures current match minute)
  const handleOpenFootballEventModal = (type: string, teamId: number) => {
    const currentMinute = Math.max(1, Math.floor(footballTimerSeconds / 60) + 1);
    setFootballEventType(type);
    setFootballEventTeamId(teamId);
    setFootballEventMinute(currentMinute);
    setFootballEventPrimaryPlayerId("");
    setFootballEventSecondaryPlayerId("");
    setShowFootballEventModal(true);
  };

  // 9. Football: Log Event Handler
  const handleSaveFootballEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footballEventTeamId || !footballEventPrimaryPlayerId) {
      alert("Please select a player.");
      return;
    }

    setActionLoading(true);
    try {
      await api.scoring.logFootballEvent(matchId, {
        teamId: Number(footballEventTeamId),
        minute: Number(footballEventMinute),
        eventType: footballEventType,
        primaryPlayerId: Number(footballEventPrimaryPlayerId),
        secondaryPlayerId: footballEventSecondaryPlayerId ? Number(footballEventSecondaryPlayerId) : null,
        currentClockSeconds: footballTimerSeconds,
      });
      triggerToast(`Event logged at ${footballEventMinute}'!`);
      setShowFootballEventModal(false);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to log event.");
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Football: Open Substitution Modal
  const handleOpenSubModal = (teamId: number) => {
    const currentMinute = Math.max(1, Math.floor(footballTimerSeconds / 60) + 1);
    setSubTeamId(teamId);
    setSubMinute(currentMinute);
    setSubPlayerOutId("");
    setSubPlayerInId("");
    setShowSubModal(true);
  };

  // 11. Football: Save Substitution Handler
  const handleSaveSubstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTeamId || !subPlayerOutId || !subPlayerInId) {
      alert("Please select both player leaving the pitch (OUT) and player entering (IN).");
      return;
    }
    if (Number(subPlayerOutId) === Number(subPlayerInId)) {
      alert("Cannot substitute a player for themselves.");
      return;
    }

    setActionLoading(true);
    try {
      await api.scoring.logFootballEvent(matchId, {
        teamId: Number(subTeamId),
        minute: Number(subMinute),
        eventType: "SUBSTITUTION",
        primaryPlayerId: Number(subPlayerInId),
        secondaryPlayerId: Number(subPlayerOutId),
        currentClockSeconds: footballTimerSeconds,
      });
      triggerToast(`Substitution recorded at ${subMinute}'!`);
      setShowSubModal(false);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to record substitution.");
    } finally {
      setActionLoading(false);
    }
  };

  // 12. Football: Save Penalty Shootout Handler
  const handleSavePenaltyShootout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penWinnerId) {
      alert("Please select the penalty shootout winner.");
      return;
    }
    setActionLoading(true);
    try {
      await api.scoring.recordPenaltyShootout(matchId, {
        teamAPenaltyScore: Number(penScoreA),
        teamBPenaltyScore: Number(penScoreB),
        shootoutWinnerTeamId: Number(penWinnerId),
        playerOfTheMatchId: penPotmId ? Number(penPotmId) : null,
      });
      triggerToast("Penalty shootout recorded! Match completed.");
      setShowPenaltyShootoutModal(false);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to record shootout.");
    } finally {
      setActionLoading(false);
    }
  };

  // 13. Football: Delete Event Handler
  const handleDeleteFootballEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.scoring.deleteFootballEvent(matchId, eventId);
      triggerToast("Event deleted.");
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete event.");
    }
  };

  // 14. Complete Match Handler
  const handleCompleteMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.scoring.completeMatch(matchId, {
        winnerTeamId: matchWinnerTeamId ? Number(matchWinnerTeamId) : null,
        resultSummary: matchResultSummary || undefined,
        playerOfTheMatchId: matchPotmId ? Number(matchPotmId) : null,
      });
      triggerToast("Match completed and result sealed!");
      setShowCompleteModal(false);
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || "Failed to complete match.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="flex items-center gap-2 font-bold text-[#7C6E63]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#9E2A2B]" />
          <span>Loading Live Scorer Console...</span>
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
          <p className="text-xs text-[#7C6E63]">{error || "Could not retrieve match details."}</p>
          <Link to="/tournaments">
            <Button className="bg-[#9E2A2B] text-white text-xs font-bold rounded-xl">Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCricket = matchData.tournament.sport === "CRICKET";
  const currentInnings = matchData.cricketInnings?.find((x: any) => x.inningsNumber === activeInningsNumber);
  const innings1 = matchData.cricketInnings?.find((x: any) => x.inningsNumber === 1);
  const targetRuns = activeInningsNumber === 2 && innings1 ? (innings1.totalRuns + 1) : null;

  // Batting and Bowling squads for the active innings
  const battingTeam = currentInnings?.battingTeamId === matchData.teamAId ? matchData.teamA : matchData.teamB;
  const bowlingTeam = currentInnings?.bowlingTeamId === matchData.teamAId ? matchData.teamA : matchData.teamB;

  const currentStrikerScore = currentInnings?.battingScorecards?.find((b: any) => b.playerId === strikerId);
  const currentNonStrikerScore = currentInnings?.battingScorecards?.find((b: any) => b.playerId === nonStrikerId);
  const currentBowlerScore = currentInnings?.bowlingScorecards?.find((b: any) => b.playerId === currentBowlerId);

  const strikerUser = matchData.matchSquads?.find((s: any) => s.userId === strikerId)?.user;
  const nonStrikerUser = matchData.matchSquads?.find((s: any) => s.userId === nonStrikerId)?.user;
  const bowlerUser = matchData.matchSquads?.find((s: any) => s.userId === currentBowlerId)?.user;

  // Recent 12 balls in current innings
  const recentBalls = currentInnings?.balls?.slice(-12) || [];

  // Stopwatch formatted string
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] pb-16">
      
      {/* Top Scorer Header Bar */}
      <div className="bg-white border-b border-[#EFE8DC] sticky top-0 z-40 px-4 py-3 shadow-xs flex items-center justify-between">
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
              <h1 className="text-xs sm:text-sm font-black text-[#2C221E]">
                Match #{matchData.matchNumber} Live Scorer: <span className="text-[#9E2A2B]">{matchData.teamA.name} vs {matchData.teamB.name}</span>
              </h1>
            </div>
            <p className="text-[10px] text-[#7C6E63] flex items-center gap-2">
              <span>🏟️ {matchData.venue || "CU Grounds"}</span>
              <span>· {matchData.tournament.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowStoryModal(true)}
            className="border-[#D8C7B3] text-[#7C6E63] hover:text-[#2C221E] text-xs h-8 px-3 rounded-xl font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59F00]" />
            <span>📸 Story Card</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSetupModal(true)}
            className="border-[#D8C7B3] text-[#7C6E63] text-xs h-8 rounded-xl font-bold"
          >
            ⚙️ Toss / Squads
          </Button>

          <Button
            type="button"
            onClick={() => setShowCompleteModal(true)}
            className="bg-[#2A7B54] hover:bg-[#206042] text-white text-xs h-8 px-3 rounded-xl font-bold flex items-center gap-1 shadow-xs"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Finish Match</span>
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Toast / Notification */}
        {notification && (
          <div className="p-3.5 rounded-2xl bg-[#E6FCF5] border border-[#20C997] text-[#0CA678] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Toss & Match Setup Banner if not set */}
        {!matchData.tossWinnerTeamId && (
          <div className="p-5 bg-[#FAF0E6] rounded-3xl border-2 border-[#E8D6C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#842021] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#9E2A2B]" />
                <span>Pre-Match Setup Required</span>
              </h3>
              <p className="text-xs text-[#6B5E53]">
                Please select the Toss Winner, Decision (Bat/Bowl), and Playing XI squads to begin scoring.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-bold h-10 px-5 rounded-2xl shadow-md shadow-[#9E2A2B]/20"
            >
              Configure Toss & Lineups
            </Button>
          </div>
        )}

        {/* ---------------- CRICKET SCORING CONSOLE ---------------- */}
        {isCricket && (
          <div className="space-y-6">
            
            {/* If innings not started yet */}
            {!currentInnings && matchData.tossWinnerTeamId && (
              <div className="p-6 bg-white rounded-3xl border-2 border-[#E5DACB] text-center space-y-4">
                <h3 className="text-base font-black text-[#2C221E]">Start Innings #{activeInningsNumber}</h3>
                <p className="text-xs text-[#7C6E63]">Choose your opening batters and bowler to begin ball-by-ball scoring.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-xs">
                  <div>
                    <label className="block font-bold mb-1">Striker 🏏</label>
                    <select
                      value={strikerId || ""}
                      onChange={(e) => setStrikerId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                    >
                      <option value="">-- Striker --</option>
                      {matchData.matchSquads?.map((s: any) => (
                        <option key={s.userId} value={s.userId}>{s.user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Non-Striker</label>
                    <select
                      value={nonStrikerId || ""}
                      onChange={(e) => setNonStrikerId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                    >
                      <option value="">-- Non-Striker --</option>
                      {matchData.matchSquads?.map((s: any) => (
                        <option key={s.userId} value={s.userId}>{s.user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Opening Bowler ⚾</label>
                    <select
                      value={currentBowlerId || ""}
                      onChange={(e) => setCurrentBowlerId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                    >
                      <option value="">-- Opening Bowler --</option>
                      {matchData.matchSquads?.map((s: any) => (
                        <option key={s.userId} value={s.userId}>{s.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleStartInnings(activeInningsNumber)}
                  disabled={actionLoading || !strikerId || !nonStrikerId || !currentBowlerId}
                  className="bg-[#9E2A2B] text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md"
                >
                  Begin Innings #{activeInningsNumber}
                </Button>
              </div>
            )}

            {/* Live Cricket Scorecard Ticker Card */}
            {currentInnings && (
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE8DC]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-0.5 rounded-full border border-[#E8D6C3]">
                        Innings {activeInningsNumber} of 2
                      </span>
                      <span className="text-xs font-bold text-[#7C6E63]">
                        {battingTeam ? battingTeam.name : "Batting Team"}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#2C221E] tracking-tight">
                        {currentInnings?.totalRuns || 0}/{currentInnings?.totalWickets || 0}
                      </span>
                      <span className="text-sm font-bold text-[#7C6E63]">
                        ({currentInnings?.totalOvers || 0} Overs)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-xs">
                    <span className="font-bold text-[#4A3E35]">
                      CRR: {currentInnings?.totalOvers > 0 ? (currentInnings.totalRuns / currentInnings.totalOvers).toFixed(2) : "0.00"}
                    </span>
                    {targetRuns && (
                      <span className="font-extrabold text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                        🎯 Target: {targetRuns} (Need {Math.max(0, targetRuns - (currentInnings?.totalRuns || 0))} runs)
                      </span>
                    )}
                  </div>
                </div>

                {/* Batters & Bowler Mini Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Striker Card */}
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border-2 border-[#9E2A2B]/40 space-y-1 relative">
                    <span className="absolute top-2 right-2 text-[10px] font-black uppercase bg-[#9E2A2B] text-white px-2 py-0.5 rounded-full">
                      Striker 🏏
                    </span>
                    <p className="font-extrabold text-[#2C221E] truncate">{strikerUser?.name || "Striker Batter"}</p>
                    <p className="font-mono text-xs font-bold text-[#7C6E63]">
                      {currentStrikerScore?.runs || 0} runs ({currentStrikerScore?.balls || 0}b) · {currentStrikerScore?.fours || 0}x4, {currentStrikerScore?.sixes || 0}x6
                    </p>
                  </div>

                  {/* Non-Striker Card */}
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] space-y-1">
                    <span className="text-[10px] font-bold text-[#7C6E63] uppercase">Non-Striker</span>
                    <p className="font-extrabold text-[#2C221E] truncate">{nonStrikerUser?.name || "Non-Striker"}</p>
                    <p className="font-mono text-xs font-bold text-[#7C6E63]">
                      {currentNonStrikerScore?.runs || 0} runs ({currentNonStrikerScore?.balls || 0}b) · {currentNonStrikerScore?.fours || 0}x4, {currentNonStrikerScore?.sixes || 0}x6
                    </p>
                  </div>

                  {/* Bowler Card */}
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#7C6E63] uppercase">Bowler</span>
                      <button
                        onClick={() => setShowChangeBowlerModal(true)}
                        className="text-[10px] font-bold text-[#9E2A2B] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="font-extrabold text-[#2C221E] truncate">{bowlerUser?.name || "Bowler"}</p>
                    <p className="font-mono text-xs font-bold text-[#7C6E63]">
                      {currentBowlerScore?.wickets || 0}/{currentBowlerScore?.runs || 0} ({currentBowlerScore?.overs || 0} ov)
                    </p>
                  </div>
                </div>

                {/* Over Ball Trail & Undo */}
                <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <span className="text-[11px] font-bold text-[#7C6E63] mr-1 shrink-0">Recent:</span>
                    {recentBalls.map((b: any) => (
                      <span
                        key={b.id}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          b.isWicket
                            ? "bg-[#C92A2A] text-white"
                            : b.runsBat === 4 || b.runsBat === 6
                            ? "bg-[#2A7B54] text-white"
                            : b.extraType === "WIDE" || b.extraType === "NO_BALL"
                            ? "bg-[#FFF9DB] text-[#F59F00] border border-[#F59F00]"
                            : "bg-[#FAF7F2] text-[#2C221E] border border-[#E8DCCF]"
                        }`}
                      >
                        {b.isWicket ? "W" : b.extraType === "WIDE" ? "Wd" : b.extraType === "NO_BALL" ? "Nb" : b.runsBat}
                      </span>
                    ))}
                    {recentBalls.length === 0 && (
                      <span className="text-xs text-[#A89A8D] italic">No deliveries in this over yet</span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUndoBall}
                    disabled={actionLoading || recentBalls.length === 0}
                    className="border-[#FFC9C9] text-[#C92A2A] hover:bg-[#FFF5F5] text-xs h-8 px-3 rounded-xl font-bold flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Ball</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Tactile Ball Input Controls */}
            {currentInnings && (
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-[#7C6E63] tracking-wider">
                  ⚡ Rapid Ball Entry Console
                </h3>

                {/* Runs Buttons */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {[0, 1, 2, 3, 4, 6].map((runs) => (
                    <button
                      key={runs}
                      disabled={actionLoading}
                      onClick={() => handleRecordBall(runs)}
                      className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all active:scale-95 shadow-xs ${
                        runs === 4 || runs === 6
                          ? "bg-[#9E2A2B] hover:bg-[#842021] text-white shadow-[#9E2A2B]/20"
                          : "bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#2C221E] border border-[#E8DCCF]"
                      }`}
                    >
                      {runs}
                    </button>
                  ))}

                  {/* Wicket Button */}
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowWicketModal(true)}
                    className="h-16 rounded-2xl bg-[#C92A2A] hover:bg-[#A61E1E] text-white font-black text-lg flex items-center justify-center transition-all active:scale-95 shadow-md shadow-[#C92A2A]/20"
                  >
                    OUT / W
                  </button>
                </div>

                {/* Extras Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#EFE8DC]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRecordBall(0, "WIDE", 1)}
                    disabled={actionLoading}
                    className="h-11 rounded-xl border-[#F59F00] bg-[#FFF9DB] text-[#7E4D00] hover:bg-[#FFF3BF] font-black text-xs"
                  >
                    Wide (+1)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRecordBall(0, "NO_BALL", 1)}
                    disabled={actionLoading}
                    className="h-11 rounded-xl border-[#F59F00] bg-[#FFF9DB] text-[#7E4D00] hover:bg-[#FFF3BF] font-black text-xs"
                  >
                    No Ball (+1)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRecordBall(0, "BYE", 1)}
                    disabled={actionLoading}
                    className="h-11 rounded-xl border-[#D8C7B3] bg-[#FAF7F2] text-[#4A3E35] font-bold text-xs"
                  >
                    Bye (+1)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRecordBall(0, "LEG_BYE", 1)}
                    disabled={actionLoading}
                    className="h-11 rounded-xl border-[#D8C7B3] bg-[#FAF7F2] text-[#4A3E35] font-bold text-xs"
                  >
                    Leg Bye (+1)
                  </Button>
                </div>

                {/* Switch Innings Button */}
                {activeInningsNumber === 1 && (
                  <div className="pt-2 border-t border-[#EFE8DC] flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        if (confirm("Switch to 2nd Innings? Ensure 1st innings is complete.")) {
                          setActiveInningsNumber(2);
                          setStrikerId(null);
                          setNonStrikerId(null);
                          setCurrentBowlerId(null);
                        }
                      }}
                      className="bg-[#9E2A2B] text-white font-bold text-xs h-9 px-4 rounded-xl"
                    >
                      Start 2nd Innings ➡️
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Broadcast Live Analytics (Partnership, Manhattan, Over Breakdown, FOW) */}
            {currentInnings && (
              <CricketLiveAnalytics match={matchData} activeInningsNumber={activeInningsNumber} />
            )}

          </div>
        )}

        {/* ---------------- FOOTBALL SCORING CONSOLE ---------------- */}
        {!isCricket && (
          <div className="space-y-6">
            
            {/* Live Football Match Clock & Scoreboard Card */}
            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-sm space-y-5">
              
              {/* Timer Header & Lifecycle Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE8DC]">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isFootballTimerRunning ? "bg-[#2A7B54] animate-pulse" : "bg-[#F59F00]"}`} />
                  <span className="font-mono text-3xl sm:text-4xl font-black text-[#2C221E] tracking-tight">
                    {formatTimer(footballTimerSeconds)}
                  </span>
                  <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                    {matchData.status === "HALFTIME"
                      ? "Half-Time Break ⏸"
                      : footballCurrentHalf === 1
                      ? "1st Half"
                      : "2nd Half"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* State 1: Match not started yet */}
                  {(matchData.status === "SCHEDULED" || matchData.status === "TOSS") && (
                    <Button
                      type="button"
                      onClick={handleStartFootballFirstHalf}
                      className="bg-[#2A7B54] hover:bg-[#206042] text-white font-black text-xs h-10 px-5 rounded-2xl shadow-md flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Match (1st Half) ▶</span>
                    </Button>
                  )}

                  {/* State 2: 1st Half LIVE */}
                  {matchData.status === "LIVE" && footballCurrentHalf === 1 && (
                    <>
                      <Button
                        type="button"
                        onClick={handleToggleFootballTimer}
                        className={`font-black text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-1.5 ${
                          isFootballTimerRunning
                            ? "bg-[#F59F00] hover:bg-[#E67700] text-white"
                            : "bg-[#2A7B54] hover:bg-[#206042] text-white"
                        }`}
                      >
                        {isFootballTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isFootballTimerRunning ? "Pause ⏸" : "Resume ▶"}</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={handleMarkHalfTime}
                        className="bg-[#842021] hover:bg-[#6D1B1C] text-white font-black text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-1.5"
                      >
                        <span>🏁 Mark Half-Time</span>
                      </Button>
                    </>
                  )}

                  {/* State 3: Half-Time Break */}
                  {matchData.status === "HALFTIME" && (
                    <Button
                      type="button"
                      onClick={handleStartFootballSecondHalf}
                      className="bg-[#2A7B54] hover:bg-[#206042] text-white font-black text-xs h-10 px-5 rounded-2xl shadow-md flex items-center gap-1.5 animate-bounce"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start 2nd Half ▶</span>
                    </Button>
                  )}

                  {/* State 4: 2nd Half LIVE */}
                  {matchData.status === "LIVE" && footballCurrentHalf === 2 && (
                    <>
                      <Button
                        type="button"
                        onClick={handleToggleFootballTimer}
                        className={`font-black text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-1.5 ${
                          isFootballTimerRunning
                            ? "bg-[#F59F00] hover:bg-[#E67700] text-white"
                            : "bg-[#2A7B54] hover:bg-[#206042] text-white"
                        }`}
                      >
                        {isFootballTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isFootballTimerRunning ? "Pause ⏸" : "Resume ▶"}</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={handleMarkFullTime}
                        className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-black text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>Mark Full Time 🏆</span>
                      </Button>
                    </>
                  )}

                  {/* Knockout Tiebreaker Penalty Shootout Trigger */}
                  {matchData.stage !== "GROUP_STAGE" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPenaltyShootoutModal(true)}
                      className="border-[#2A7B54] text-[#2A7B54] hover:bg-[#E6FCF5] font-black text-xs h-10 px-3.5 rounded-2xl flex items-center gap-1"
                    >
                      <span>🥅 Penalty Shootout</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Big Score Display with Quick Goal, Card, and Sub Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team A Box */}
                <div className="p-5 bg-[#FAF7F2] rounded-3xl border-2 border-[#E8DCCF] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#2C221E]">{matchData.teamA.name}</h3>
                    <div className="text-right">
                      <span className="font-mono text-3xl font-black text-[#9E2A2B]">
                        {matchData.footballDetail?.teamAScore || 0}
                      </span>
                      {matchData.footballDetail?.teamAPenaltyScore !== null && matchData.footballDetail?.teamAPenaltyScore !== undefined && (
                        <span className="block text-xs font-black text-[#2A7B54]">
                          ({matchData.footballDetail.teamAPenaltyScore} pens)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8DCCF]">
                    <Button
                      type="button"
                      onClick={() => handleOpenFootballEventModal("GOAL", matchData.teamAId)}
                      className="bg-[#2A7B54] hover:bg-[#206042] text-white text-xs font-black h-8 px-3 rounded-xl shadow-xs"
                    >
                      + Goal ⚽
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenFootballEventModal("YELLOW_CARD", matchData.teamAId)}
                      className="border-[#F59F00] bg-[#FFF9DB] text-[#7E4D00] text-xs font-bold h-8 px-2.5 rounded-xl"
                    >
                      + Yellow 🟨
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenFootballEventModal("RED_CARD", matchData.teamAId)}
                      className="border-[#FFC9C9] bg-[#FFF5F5] text-[#C92A2A] text-xs font-bold h-8 px-2.5 rounded-xl"
                    >
                      + Red 🟥
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenSubModal(matchData.teamAId)}
                      className="border-[#339AF0] bg-[#E7F5FF] text-[#1864AB] text-xs font-bold h-8 px-2.5 rounded-xl flex items-center gap-1"
                    >
                      <span>🔄 Sub</span>
                    </Button>
                  </div>
                </div>

                {/* Team B Box */}
                <div className="p-5 bg-[#FAF7F2] rounded-3xl border-2 border-[#E8DCCF] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#2C221E]">{matchData.teamB.name}</h3>
                    <div className="text-right">
                      <span className="font-mono text-3xl font-black text-[#9E2A2B]">
                        {matchData.footballDetail?.teamBScore || 0}
                      </span>
                      {matchData.footballDetail?.teamBPenaltyScore !== null && matchData.footballDetail?.teamBPenaltyScore !== undefined && (
                        <span className="block text-xs font-black text-[#2A7B54]">
                          ({matchData.footballDetail.teamBPenaltyScore} pens)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8DCCF]">
                    <Button
                      type="button"
                      onClick={() => handleOpenFootballEventModal("GOAL", matchData.teamBId)}
                      className="bg-[#2A7B54] hover:bg-[#206042] text-white text-xs font-black h-8 px-3 rounded-xl shadow-xs"
                    >
                      + Goal ⚽
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenFootballEventModal("YELLOW_CARD", matchData.teamBId)}
                      className="border-[#F59F00] bg-[#FFF9DB] text-[#7E4D00] text-xs font-bold h-8 px-2.5 rounded-xl"
                    >
                      + Yellow 🟨
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenFootballEventModal("RED_CARD", matchData.teamBId)}
                      className="border-[#FFC9C9] bg-[#FFF5F5] text-[#C92A2A] text-xs font-bold h-8 px-2.5 rounded-xl"
                    >
                      + Red 🟥
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenSubModal(matchData.teamBId)}
                      className="border-[#339AF0] bg-[#E7F5FF] text-[#1864AB] text-xs font-bold h-8 px-2.5 rounded-xl flex items-center gap-1"
                    >
                      <span>🔄 Sub</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Match Events Timeline */}
              <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
                <h4 className="text-xs font-black uppercase text-[#7C6E63] tracking-wider">
                  Live Event Timeline ({matchData.footballEvents?.length || 0})
                </h4>

                <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {matchData.footballEvents?.map((ev: any) => (
                    <div key={ev.id} className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="font-mono text-[#9E2A2B] bg-[#FAF0E6] px-2 py-0.5 rounded border border-[#E8D6C3]">
                          {ev.minute}'
                        </span>
                        {ev.eventType === "SUBSTITUTION" ? (
                          <span className="text-[#1864AB]">
                            🔄 Sub: <strong className="text-[#2A7B54]">{ev.primaryPlayer?.name} (IN)</strong> for <span className="text-[#C92A2A] font-normal">{ev.secondaryPlayer?.name} (OUT)</span>
                          </span>
                        ) : (
                          <span>
                            {ev.eventType === "GOAL" ? "⚽ Goal" : ev.eventType === "YELLOW_CARD" ? "🟨 Yellow Card" : "🟥 Red Card"}
                            : <span className="text-[#2C221E]">{ev.primaryPlayer?.name}</span>
                            {ev.secondaryPlayer && <span className="text-[#7C6E63] font-normal"> (Assist: {ev.secondaryPlayer.name})</span>}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteFootballEvent(ev.id)}
                        className="p-1 text-[#7C6E63] hover:text-[#C92A2A]"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(!matchData.footballEvents || matchData.footballEvents.length === 0) && (
                    <p className="text-xs text-[#A89A8D] italic p-3 text-center">
                      No match events logged yet. Match clock will auto-record event minutes when goals, cards, or subs occur.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ---------------- MODALS ---------------- */}

      {/* TOSS & SQUADS SETUP MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-5 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF7F2]">
              <h3 className="text-sm font-black text-[#2C221E]">Match Toss & Lineup Setup</h3>
              <button onClick={() => setShowSetupModal(false)} className="text-[#7C6E63]">✕</button>
            </div>

            {/* Lock notification if match is already underway */}
            {matchData.status !== "SCHEDULED" && matchData.status !== "TOSS" ? (
              <div className="p-6 space-y-4 text-xs">
                <div className="p-4 bg-[#FFF9DB] border border-[#F59F00] rounded-2xl text-[#7E4D00] flex items-start gap-2.5">
                  <span className="text-lg">🔒</span>
                  <div>
                    <h4 className="font-extrabold text-sm">Lineups Locked</h4>
                    <p className="mt-1 leading-relaxed text-xs">
                      This match is already in progress (Status: <strong>{matchData.status}</strong>). Starting lineups and toss outcome cannot be modified.
                    </p>
                    <p className="mt-2 font-bold">
                      💡 To change active players on the pitch during a match, use the <span className="text-[#1864AB]">🔄 Substitution</span> button on the scoreboard.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="button" onClick={() => setShowSetupModal(false)} className="bg-[#9E2A2B] text-white">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSetup} className="p-5 space-y-4 overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Toss Winner Team</label>
                    <select
                      value={tossWinnerTeamId}
                      onChange={(e) => setTossWinnerTeamId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                    >
                      <option value={matchData.teamAId}>{matchData.teamA.name}</option>
                      <option value={matchData.teamBId}>{matchData.teamB.name}</option>
                    </select>
                  </div>

                  {isCricket && (
                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Elected Decision</label>
                      <select
                        value={tossDecision}
                        onChange={(e) => setTossDecision(e.target.value as "BAT" | "BOWL")}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                      >
                        <option value="BAT">Bat First 🏏</option>
                        <option value="BOWL">Bowl First ⚾</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Team A Lineup Checkbox list */}
                <div className="space-y-1 pt-2 border-t border-[#EFE8DC]">
                  <label className="block font-black text-[#2C221E]">{matchData.teamA.name} Lineup ({selectedTeamAPlayers.length} selected):</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#FAF7F2] rounded-xl border">
                    {matchData.teamA.members?.map((m: any) => (
                      <label key={m.userId} className="flex items-center gap-1.5 text-[11px]">
                        <input
                          type="checkbox"
                          checked={selectedTeamAPlayers.includes(m.userId)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTeamAPlayers(prev => [...prev, m.userId]);
                            else setSelectedTeamAPlayers(prev => prev.filter(id => id !== m.userId));
                          }}
                        />
                        <span className="truncate">{m.user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Team B Lineup Checkbox list */}
                <div className="space-y-1 pt-2 border-t border-[#EFE8DC]">
                  <label className="block font-black text-[#2C221E]">{matchData.teamB.name} Lineup ({selectedTeamBPlayers.length} selected):</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#FAF7F2] rounded-xl border">
                    {matchData.teamB.members?.map((m: any) => (
                      <label key={m.userId} className="flex items-center gap-1.5 text-[11px]">
                        <input
                          type="checkbox"
                          checked={selectedTeamBPlayers.includes(m.userId)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTeamBPlayers(prev => [...prev, m.userId]);
                            else setSelectedTeamBPlayers(prev => prev.filter(id => id !== m.userId));
                          }}
                        />
                        <span className="truncate">{m.user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE8DC] flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowSetupModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={actionLoading} className="bg-[#9E2A2B] text-white">Save Setup</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CRICKET: WICKET RECORDING MODAL */}
      {showWicketModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
            <h3 className="text-sm font-black text-[#C92A2A]">Record Wicket 💥</h3>

            <form onSubmit={handleRecordWicket} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Dismissal Type</label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="CAUGHT">Caught</option>
                  <option value="BOWLED">Bowled</option>
                  <option value="LBW">LBW</option>
                  <option value="RUN_OUT">Run Out</option>
                  <option value="STUMPED">Stumped</option>
                  <option value="HIT_WICKET">Hit Wicket</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Dismissed Batter</label>
                <select
                  value={wicketPlayerOutId}
                  onChange={(e) => setWicketPlayerOutId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value={strikerId || ""}>Striker: {strikerUser?.name}</option>
                  <option value={nonStrikerId || ""}>Non-Striker: {nonStrikerUser?.name}</option>
                </select>
              </div>

              {(wicketType === "CAUGHT" || wicketType === "RUN_OUT" || wicketType === "STUMPED") && (
                <div>
                  <label className="block font-bold mb-1">Fielder / Keeper</label>
                  <select
                    value={wicketFielderId}
                    onChange={(e) => setWicketFielderId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                  >
                    <option value="">-- Select Fielder --</option>
                    {bowlingTeam?.members?.map((m: any) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">Incoming Batter</label>
                <select
                  value={wicketNewBatterId}
                  onChange={(e) => setWicketNewBatterId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="">-- Select Next Batter (or None if All Out) --</option>
                  {battingTeam?.members?.filter((m: any) => m.userId !== strikerId && m.userId !== nonStrikerId).map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowWicketModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading} className="bg-[#C92A2A] text-white">Record Out</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRICKET: CHANGE BOWLER MODAL */}
      {showChangeBowlerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-sm p-5 space-y-4 text-xs">
            <h3 className="text-sm font-black text-[#2C221E]">Select Next Bowler ⚾</h3>

            <form onSubmit={handleChangeBowler} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Bowler from {bowlingTeam?.name}</label>
                <select
                  required
                  value={nextBowlerSelection}
                  onChange={(e) => setNextBowlerSelection(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="">-- Choose Bowler --</option>
                  {bowlingTeam?.members?.filter((m: any) => m.userId !== currentBowlerId).map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowChangeBowlerModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#9E2A2B] text-white">Confirm Bowler</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTBALL: EVENT LOGGING MODAL */}
      {showFootballEventModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
            <h3 className="text-sm font-black text-[#2C221E]">
              Log Event: <span className="text-[#9E2A2B]">{footballEventType.replace("_", " ")}</span>
            </h3>

            <form onSubmit={handleSaveFootballEvent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Match Minute (Auto)</label>
                  <input
                    type="number"
                    min={1}
                    max={130}
                    value={footballEventMinute}
                    onChange={(e) => setFootballEventMinute(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Team</label>
                  <select
                    value={footballEventTeamId}
                    onChange={(e) => setFootballEventTeamId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                  >
                    <option value={matchData.teamAId}>{matchData.teamA.name}</option>
                    <option value={matchData.teamBId}>{matchData.teamB.name}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Player on Field ({getOnFieldPlayers(Number(footballEventTeamId)).length} Available)
                </label>
                <select
                  required
                  value={footballEventPrimaryPlayerId}
                  onChange={(e) => setFootballEventPrimaryPlayerId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] font-semibold"
                >
                  <option value="">-- Choose Active On-Field Player --</option>
                  {getOnFieldPlayers(Number(footballEventTeamId)).map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                  ))}
                </select>
              </div>

              {footballEventType === "GOAL" && (
                <div>
                  <label className="block font-bold mb-1">Assist Provider (Optional)</label>
                  <select
                    value={footballEventSecondaryPlayerId}
                    onChange={(e) => setFootballEventSecondaryPlayerId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                  >
                    <option value="">-- None (Solo Goal) --</option>
                    {getOnFieldPlayers(Number(footballEventTeamId))
                      .filter((m: any) => m.userId !== Number(footballEventPrimaryPlayerId))
                      .map((m: any) => (
                        <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowFootballEventModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading} className="bg-[#9E2A2B] text-white">Save Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTBALL: SUBSTITUTION MODAL */}
      {showSubModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
            <h3 className="text-sm font-black text-[#1864AB] flex items-center gap-1.5">
              <span>🔄</span>
              <span>Record Player Substitution</span>
            </h3>

            <form onSubmit={handleSaveSubstitution} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Minute</label>
                  <input
                    type="number"
                    min={1}
                    max={130}
                    value={subMinute}
                    onChange={(e) => setSubMinute(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Team</label>
                  <select
                    value={subTeamId}
                    onChange={(e) => {
                      setSubTeamId(Number(e.target.value));
                      setSubPlayerOutId("");
                      setSubPlayerInId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                  >
                    <option value={matchData.teamAId}>{matchData.teamA.name}</option>
                    <option value={matchData.teamBId}>{matchData.teamB.name}</option>
                  </select>
                </div>
              </div>

              {/* Player Out (Leaving Pitch - ONLY Players on Field) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-[#C92A2A]">Player Leaving Pitch (OUT) 🟥</label>
                  <span className="text-[10px] font-bold text-[#7C6E63]">On Field ({getOnFieldPlayers(Number(subTeamId)).length})</span>
                </div>
                <select
                  required
                  value={subPlayerOutId}
                  onChange={(e) => setSubPlayerOutId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#FFC9C9] bg-[#FFF5F5] font-bold text-[#C92A2A]"
                >
                  <option value="">-- Choose Active On-Field Player --</option>
                  {getOnFieldPlayers(Number(subTeamId)).map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                  ))}
                </select>
              </div>

              {/* Player In (Entering Pitch - ONLY Players other than that / Bench) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-[#2A7B54]">Player Entering Pitch (IN) 🟩</label>
                  <span className="text-[10px] font-bold text-[#7C6E63]">Bench ({getBenchPlayers(Number(subTeamId)).length})</span>
                </div>
                <select
                  required
                  value={subPlayerInId}
                  onChange={(e) => setSubPlayerInId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#B2F2BB] bg-[#EBFBEE] font-bold text-[#2A7B54]"
                >
                  <option value="">-- Choose Bench / Reserve Player --</option>
                  {getBenchPlayers(Number(subTeamId)).map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                  ))}
                </select>
                {getBenchPlayers(Number(subTeamId)).length === 0 && (
                  <p className="text-[11px] text-[#C92A2A] mt-1 font-semibold">
                    ⚠️ No bench reserve players registered for this team.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSubModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading || getBenchPlayers(Number(subTeamId)).length === 0} className="bg-[#1864AB] hover:bg-[#15538E] text-white font-bold">
                  Confirm Substitution 🔄
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTBALL: KNOCKOUT PENALTY SHOOTOUT MODAL */}
      {showPenaltyShootoutModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-xs">
            <div className="text-center space-y-1">
              <span className="text-2xl">🥅⚽</span>
              <h3 className="text-base font-black text-[#2C221E]">Knockout Penalty Shootout</h3>
              <p className="text-xs text-[#7C6E63]">Scores were tied at Full Time. Record penalty kick conversions.</p>
            </div>

            <form onSubmit={handleSavePenaltyShootout} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* Team A Pens */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border-2 border-[#E8DCCF] space-y-2">
                  <p className="font-extrabold text-xs text-[#2C221E] truncate">{matchData.teamA.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPenScoreA(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-white border font-black text-sm"
                    >
                      -
                    </button>
                    <span className="font-mono text-3xl font-black text-[#9E2A2B]">{penScoreA}</span>
                    <button
                      type="button"
                      onClick={() => setPenScoreA(prev => prev + 1)}
                      className="w-8 h-8 rounded-xl bg-white border font-black text-sm"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[10px] text-[#7C6E63] font-bold">Penalties Scored</p>
                </div>

                {/* Team B Pens */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border-2 border-[#E8DCCF] space-y-2">
                  <p className="font-extrabold text-xs text-[#2C221E] truncate">{matchData.teamB.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPenScoreB(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-white border font-black text-sm"
                    >
                      -
                    </button>
                    <span className="font-mono text-3xl font-black text-[#9E2A2B]">{penScoreB}</span>
                    <button
                      type="button"
                      onClick={() => setPenScoreB(prev => prev + 1)}
                      className="w-8 h-8 rounded-xl bg-white border font-black text-sm"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[10px] text-[#7C6E63] font-bold">Penalties Scored</p>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Shootout Winner Team</label>
                <select
                  required
                  value={penWinnerId}
                  onChange={(e) => setPenWinnerId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] font-extrabold"
                >
                  <option value="">-- Select Shootout Winner --</option>
                  <option value={matchData.teamAId}>{matchData.teamA.name} (Wins Shootout 🏆)</option>
                  <option value={matchData.teamBId}>{matchData.teamB.name} (Wins Shootout 🏆)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Player of the Match (Optional)</label>
                <select
                  value={penPotmId}
                  onChange={(e) => setPenPotmId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="">-- Select POTM --</option>
                  {[...(matchData.teamA.members || []), ...(matchData.teamB.members || [])].map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPenaltyShootoutModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading} className="bg-[#2A7B54] text-white font-bold">
                  Seal Shootout & Advance Winner 🏆
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE MATCH MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
            <h3 className="text-sm font-black text-[#2A7B54] flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Seal Match Result & Complete</span>
            </h3>

            <form onSubmit={handleCompleteMatch} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Winning Team</label>
                <select
                  value={matchWinnerTeamId}
                  onChange={(e) => setMatchWinnerTeamId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="">-- No Winner (Tied / Draw) --</option>
                  <option value={matchData.teamAId}>{matchData.teamA.name} (Winner)</option>
                  <option value={matchData.teamBId}>{matchData.teamB.name} (Winner)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Result Summary Note</label>
                <input
                  type="text"
                  placeholder="e.g. 24th Batch won by 6 runs or Anabil 21 won 2-0"
                  value={matchResultSummary}
                  onChange={(e) => setMatchResultSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Player of the Match (POTM)</label>
                <select
                  value={matchPotmId}
                  onChange={(e) => setMatchPotmId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="">-- Select POTM --</option>
                  {[...(matchData.teamA.members || []), ...(matchData.teamB.members || [])].map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading} className="bg-[#2A7B54] text-white font-bold">
                  Seal Result 🏆
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Match Story Card Modal */}
      <MatchStoryCardModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        match={matchData}
      />

    </div>
  );
};
