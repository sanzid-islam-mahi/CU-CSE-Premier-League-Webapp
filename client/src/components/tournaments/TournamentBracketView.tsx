import React, { useState } from "react";
import { 
  Trophy, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Pencil,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface TournamentBracketViewProps {
  tournament: any;
  isOrganizer: boolean;
  onRefresh: () => void;
  onEditMatch?: (match: any) => void;
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  tournament,
  isOrganizer,
  onRefresh,
  onEditMatch,
}) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const matches = tournament.matches || [];
  
  // Group stage progress metrics
  const groupMatches = matches.filter((m: any) => m.stage === "GROUP_STAGE");
  const totalGroupMatches = groupMatches.length;
  const completedGroupMatches = groupMatches.filter((m: any) => m.status === "COMPLETED").length;
  const isGroupStageFinished = totalGroupMatches > 0 && completedGroupMatches === totalGroupMatches;

  // Knockout stage matches
  const semiFinals = matches.filter((m: any) => m.stage === "SEMI_FINAL");
  const finalMatch = matches.find((m: any) => m.stage === "FINAL");
  const thirdPlaceMatch = matches.find((m: any) => m.stage === "THIRD_PLACE");

  const hasKnockoutsGenerated = semiFinals.length > 0 || !!finalMatch;
  const isFinalCompleted = finalMatch && finalMatch.status === "COMPLETED";
  const championTeam = isFinalCompleted ? (finalMatch.winnerTeam || tournament.teams?.find((t: any) => t.id === finalMatch.winnerTeamId)) : null;

  // Handle Generate Knockout Fixtures
  const handleGenerateKnockouts = async () => {
    if (!isGroupStageFinished) {
      alert(`Cannot generate knockout fixtures yet: ${totalGroupMatches - completedGroupMatches} group stage match(es) are still in progress.\n\nKnockout fixtures will unlock once all group matches finish and the points table is finalized.`);
      return;
    }

    if (!confirm("This will lock in the Semi-Finals and Final fixtures based on the final group stage standings. Proceed?")) return;

    setLoading(true);
    try {
      const res = await api.matches.generateKnockouts(tournament.id);
      triggerToast(res.message || "Knockout fixtures generated!");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to generate knockout bracket.");
    } finally {
      setLoading(false);
    }
  };

  // Group references
  const groupA = tournament.groups?.[0];
  const groupB = tournament.groups?.[1];

  // Team names for SF1 & SF2
  const sf1TeamA = semiFinals[0]?.teamA?.name || (groupA ? `🥇 1st Place ${groupA.name}` : "Winner Group A");
  const sf1TeamB = semiFinals[0]?.teamB?.name || (groupB ? `🥈 2nd Place ${groupB.name}` : "Runner-Up Group B");
  const sf2TeamA = semiFinals[1]?.teamA?.name || (groupB ? `🥇 1st Place ${groupB.name}` : "Winner Group B");
  const sf2TeamB = semiFinals[1]?.teamB?.name || (groupA ? `🥈 2nd Place ${groupA.name}` : "Runner-Up Group A");

  const finalTeamA = finalMatch?.teamA?.name || (semiFinals[0]?.winnerTeam?.name || "Winner Semi-Final 1");
  const finalTeamB = finalMatch?.teamB?.name || (semiFinals[1]?.winnerTeam?.name || "Winner Semi-Final 2");

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-[#E6FCF5] border border-[#20C997] text-[#0CA678] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOURNAMENT LIFECYCLE BANNER */}
      <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#9E2A2B]" />
              <h2 className="text-base sm:text-lg font-black text-[#2C221E]">
                Championship Knockout Bracket
              </h2>
            </div>
            
            {/* Status indicator */}
            {!isGroupStageFinished ? (
              <p className="text-xs text-[#7C6E63] flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#F59F00] animate-pulse shrink-0" />
                <span>
                  <strong>Phase 1: Group Stage In Progress</strong> · {completedGroupMatches} of {totalGroupMatches} matches played.
                </span>
              </p>
            ) : (
              <p className="text-xs text-[#2A7B54] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#2A7B54] shrink-0" />
                <span>
                  <strong>Phase 2: Group Stage Concluded!</strong> Top 2 teams from each group qualify for the Semi-Finals.
                </span>
              </p>
            )}
          </div>

          {isOrganizer && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerateKnockouts}
                disabled={loading || !isGroupStageFinished}
                className={`font-bold text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-1.5 shrink-0 ${
                  !isGroupStageFinished
                    ? "bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3] cursor-not-allowed opacity-75 shadow-none"
                    : "bg-[#2A7B54] hover:bg-[#206042] text-white shadow-[#2A7B54]/20"
                }`}
                title={!isGroupStageFinished ? `Locked: ${totalGroupMatches - completedGroupMatches} group matches remaining` : "Generate Semi-Finals"}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {!isGroupStageFinished
                    ? `🔒 Seed Semi-Finals (${completedGroupMatches}/${totalGroupMatches} Played)`
                    : hasKnockoutsGenerated
                    ? "⚡ Re-Seed Knockouts from Standings"
                    : "⚡ Lock Standings & Seed Semi-Finals"}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* Informative Lifecycle Note */}
        {!hasKnockoutsGenerated && (
          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-xs text-[#6B5E53] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#9E2A2B] shrink-0 mt-0.5" />
            <p>
              The bracket below displays the <strong>Official Tournament Roadmap</strong>. In this format, the <strong>Winner of Group A (1st)</strong> plays the <strong>Runner-Up of Group B (2nd)</strong> in SF1, and the <strong>Winner of Group B (1st)</strong> plays the <strong>Runner-Up of Group A (2nd)</strong> in SF2. Once the group matches are completed, the top 2 teams will be finalized into the Semi-Final fixtures.
            </p>
          </div>
        )}
      </div>

      {/* VISUAL BRACKET TREE */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] grid grid-cols-3 gap-6 items-center">
          
          {/* COLUMN 1: SEMI-FINALS */}
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-[#E5DACB]">
              <span className="text-xs font-black uppercase text-[#9E2A2B] tracking-wider bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
                Semi-Finals
              </span>
            </div>

            {/* SF 1 Node */}
            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] hover:border-[#9E2A2B] p-4 shadow-xs space-y-2.5 transition-all relative">
              <div className="flex items-center justify-between text-[10px] text-[#7C6E63] pb-1 border-b border-[#EFE8DC]">
                <span className="font-bold text-[#9E2A2B]">
                  {semiFinals[0] ? `Match #${semiFinals[0].matchNumber}` : "Semi-Final 1"}
                </span>
                <span className="font-semibold text-[#2A7B54]">
                  {semiFinals[0]?.status || (hasKnockoutsGenerated ? "SCHEDULED" : "Awaiting Qualifiers")}
                </span>
                {isOrganizer && semiFinals[0] && onEditMatch && (
                  <button
                    onClick={() => onEditMatch(semiFinals[0])}
                    className="p-1 text-[#7C6E63] hover:text-[#9E2A2B]"
                    title="Edit Match"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Team A */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-extrabold ${
                semiFinals[0]?.winnerTeamId === semiFinals[0]?.teamAId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md brick-gradient text-white flex items-center justify-center text-[9px] shrink-0 font-mono">
                    {semiFinals[0]?.teamA?.shortName || "A1"}
                  </span>
                  <span className="truncate">{sf1TeamA}</span>
                </div>
                {semiFinals[0]?.winnerTeamId === semiFinals[0]?.teamAId && <span>👑</span>}
              </div>

              {/* Team B */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-extrabold ${
                semiFinals[0]?.winnerTeamId === semiFinals[0]?.teamBId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md brick-gradient text-white flex items-center justify-center text-[9px] shrink-0 font-mono">
                    {semiFinals[0]?.teamB?.shortName || "B2"}
                  </span>
                  <span className="truncate">{sf1TeamB}</span>
                </div>
                {semiFinals[0]?.winnerTeamId === semiFinals[0]?.teamBId && <span>👑</span>}
              </div>

              {/* Match Venue / Time */}
              <div className="pt-1 flex items-center justify-between text-[10px] text-[#7C6E63]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#9E2A2B]" />
                  <span>{semiFinals[0]?.venue || "CU CSE Grounds"}</span>
                </span>
                {semiFinals[0]?.startTime ? (
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#9E2A2B]" />
                    {new Date(semiFinals[0].startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : (
                  <span className="italic text-[#A89A8D]">Post-Group Stage</span>
                )}
              </div>
            </div>

            {/* SF 2 Node */}
            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] hover:border-[#9E2A2B] p-4 shadow-xs space-y-2.5 transition-all relative">
              <div className="flex items-center justify-between text-[10px] text-[#7C6E63] pb-1 border-b border-[#EFE8DC]">
                <span className="font-bold text-[#9E2A2B]">
                  {semiFinals[1] ? `Match #${semiFinals[1].matchNumber}` : "Semi-Final 2"}
                </span>
                <span className="font-semibold text-[#2A7B54]">
                  {semiFinals[1]?.status || (hasKnockoutsGenerated ? "SCHEDULED" : "Awaiting Qualifiers")}
                </span>
                {isOrganizer && semiFinals[1] && onEditMatch && (
                  <button
                    onClick={() => onEditMatch(semiFinals[1])}
                    className="p-1 text-[#7C6E63] hover:text-[#9E2A2B]"
                    title="Edit Match"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Team A */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-extrabold ${
                semiFinals[1]?.winnerTeamId === semiFinals[1]?.teamAId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md brick-gradient text-white flex items-center justify-center text-[9px] shrink-0 font-mono">
                    {semiFinals[1]?.teamA?.shortName || "B1"}
                  </span>
                  <span className="truncate">{sf2TeamA}</span>
                </div>
                {semiFinals[1]?.winnerTeamId === semiFinals[1]?.teamAId && <span>👑</span>}
              </div>

              {/* Team B */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-extrabold ${
                semiFinals[1]?.winnerTeamId === semiFinals[1]?.teamBId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md brick-gradient text-white flex items-center justify-center text-[9px] shrink-0 font-mono">
                    {semiFinals[1]?.teamB?.shortName || "A2"}
                  </span>
                  <span className="truncate">{sf2TeamB}</span>
                </div>
                {semiFinals[1]?.winnerTeamId === semiFinals[1]?.teamBId && <span>👑</span>}
              </div>

              {/* Match Venue / Time */}
              <div className="pt-1 flex items-center justify-between text-[10px] text-[#7C6E63]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#9E2A2B]" />
                  <span>{semiFinals[1]?.venue || "CU CSE Grounds"}</span>
                </span>
                {semiFinals[1]?.startTime ? (
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#9E2A2B]" />
                    {new Date(semiFinals[1].startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : (
                  <span className="italic text-[#A89A8D]">Post-Group Stage</span>
                )}
              </div>
            </div>

          </div>

          {/* COLUMN 2: GRAND FINAL & 3RD PLACE */}
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-[#E5DACB]">
              <span className="text-xs font-black uppercase text-[#842021] tracking-wider bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
                🏆 Grand Final
              </span>
            </div>

            {/* Grand Final Node */}
            <div className="bg-white rounded-3xl border-2 border-[#9E2A2B] p-5 shadow-lg shadow-[#9E2A2B]/10 space-y-3 relative overflow-hidden">
              <div className="h-1.5 w-full brick-gradient absolute top-0 left-0 right-0" />

              <div className="flex items-center justify-between text-[11px] text-[#7C6E63] pb-1.5 border-b border-[#EFE8DC]">
                <span className="font-black text-[#9E2A2B]">
                  {finalMatch ? `Match #${finalMatch.matchNumber} · FINAL` : "Championship Final"}
                </span>
                <span className="font-bold text-[#2A7B54]">
                  {finalMatch?.status || (hasKnockoutsGenerated ? "SCHEDULED" : "Awaiting SF Winners")}
                </span>
                {isOrganizer && finalMatch && onEditMatch && (
                  <button
                    onClick={() => onEditMatch(finalMatch)}
                    className="p-1 text-[#7C6E63] hover:text-[#9E2A2B]"
                    title="Edit Match"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Team A (Winner SF1) */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-black ${
                finalMatch?.winnerTeamId === finalMatch?.teamAId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg brick-gradient text-white flex items-center justify-center text-[10px] font-mono shrink-0">
                    {finalMatch?.teamA?.shortName || "SF1"}
                  </span>
                  <span className="truncate">
                    {finalTeamA}
                  </span>
                </div>
                {finalMatch?.winnerTeamId === finalMatch?.teamAId && <span className="text-sm">👑</span>}
              </div>

              <div className="text-center font-mono text-[10px] font-extrabold text-[#9E2A2B]">
                VS
              </div>

              {/* Team B (Winner SF2) */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-black ${
                finalMatch?.winnerTeamId === finalMatch?.teamBId
                  ? "bg-[#E6FCF5] border-[#20C997] text-[#0CA678]"
                  : "bg-[#FAF7F2] border-[#E8DCCF] text-[#2C221E]"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg brick-gradient text-white flex items-center justify-center text-[10px] font-mono shrink-0">
                    {finalMatch?.teamB?.shortName || "SF2"}
                  </span>
                  <span className="truncate">
                    {finalTeamB}
                  </span>
                </div>
                {finalMatch?.winnerTeamId === finalMatch?.teamBId && <span className="text-sm">👑</span>}
              </div>

              {/* Venue / Timing */}
              <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-[10px] text-[#7C6E63]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#9E2A2B]" />
                  <span>{finalMatch?.venue || "CU CSE Main Ground"}</span>
                </span>
                {finalMatch?.resultSummary && (
                  <span className="font-bold text-[#842021]">{finalMatch.resultSummary}</span>
                )}
              </div>
            </div>

            {/* 3rd Place Playoff (if scheduled) */}
            {thirdPlaceMatch && (
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#7C6E63]">
                  <span className="font-bold text-[#4A3E35]">3rd Place Playoff</span>
                  <span>{thirdPlaceMatch.status}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-[#2C221E]">
                  <span>{thirdPlaceMatch.teamA.name}</span>
                  <span className="text-[10px] font-mono text-[#9E2A2B]">vs</span>
                  <span>{thirdPlaceMatch.teamB.name}</span>
                </div>
              </div>
            )}

          </div>

          {/* COLUMN 3: CHAMPION TROPHY PEDESTAL */}
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-[#E5DACB]">
              <span className="text-xs font-black uppercase text-[#7E4D00] tracking-wider bg-[#FFF9DB] px-3 py-1 rounded-full border border-[#F59F00]">
                👑 Crowned Champion
              </span>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 text-center space-y-4 shadow-sm flex flex-col items-center justify-center min-h-[260px]">
              {championTeam ? (
                <div className="space-y-3 animate-bounce duration-1000">
                  <div className="w-16 h-16 rounded-3xl bg-[#FFF9DB] text-[#F59F00] flex items-center justify-center text-3xl border-2 border-[#F59F00] shadow-md shadow-[#F59F00]/20 mx-auto">
                    🏆
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-full border border-[#E8D6C3]">
                      Champions 2026
                    </span>
                    <h3 className="text-lg font-black text-[#2C221E] mt-1">
                      {championTeam.name}
                    </h3>
                    <p className="text-xs text-[#7C6E63]">
                      {championTeam.batch ? `🏛️ ${championTeam.batch.name}` : "CU CSE"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 opacity-60">
                  <div className="w-16 h-16 rounded-3xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center text-3xl border border-[#E8D6C3] mx-auto">
                    🏆
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#2C221E]">Trophy Awaiting Victor</p>
                    <p className="text-[11px] text-[#7C6E63]">
                      Will be crowned at the Grand Championship Final!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
