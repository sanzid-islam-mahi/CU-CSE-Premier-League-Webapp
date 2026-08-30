import React from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import type { TournamentItem } from "@/lib/api";

interface TournamentCardProps {
  tournament: TournamentItem;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const isCricket = tournament.sport === "CRICKET";
  const rules = tournament.rules || {};

  return (
    <div className="bg-white rounded-3xl border-2 border-[#E5DACB] hover:border-[#9E2A2B] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      
      {/* TOP PART: HERO BANNER & STATUS */}
      <div className="relative h-40 sm:h-44 w-full bg-[#FAF0E6] overflow-hidden">
        {tournament.bannerUrl ? (
          <img
            src={tournament.bannerUrl}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#9E2A2B] via-[#842021] to-[#2C221E] flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-15 flex items-center justify-center text-7xl select-none">
              {isCricket ? "🏏" : "⚽"}
            </div>
            <div className="relative text-center text-white/50 text-xs font-bold uppercase tracking-wider">
              {isCricket ? "Cricket Championship Arena" : "Football League Arena"}
            </div>
          </div>
        )}

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

        {/* Top Badges (Sport & Status) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
          <div className="px-3 py-1 rounded-full backdrop-blur-md bg-black/50 text-white text-[11px] font-black border border-white/20 shadow-xs flex items-center gap-1.5">
            <span>{isCricket ? "🏏" : "⚽"}</span>
            <span className="capitalize">{tournament.sport.toLowerCase()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs border ${
                tournament.status === "ONGOING"
                  ? "bg-[#2A7B54] text-white border-white/30 animate-pulse"
                  : tournament.status === "UPCOMING"
                  ? "bg-[#F59F00] text-[#3E2900] border-white/30"
                  : tournament.status === "COMPLETED"
                  ? "bg-[#2C221E] text-white border-white/20"
                  : "bg-white/90 text-[#7C6E63] border-white/30"
              }`}
            >
              {tournament.status === "ONGOING" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-ping" />}
              {tournament.status}
            </span>
          </div>
        </div>

        {/* Floating Tournament Crest Logo */}
        <div className="absolute -bottom-4 left-5 z-20">
          <SmartAvatar
            src={tournament.logoUrl}
            alt={tournament.name}
            fallbackText={tournament.name}
            size="lg"
            shape="rounded"
            className="ring-4 ring-white shadow-xl bg-white"
          />
        </div>
      </div>

      {/* BOTTOM PART: METADATA & SPECS */}
      <div className="p-5 pt-7 space-y-4 bg-white flex flex-col justify-between flex-1">
        
        <div className="space-y-2.5">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors leading-tight line-clamp-1">
              {tournament.name}
            </h3>
            <p className="text-xs font-bold text-[#7C6E63] mt-0.5">
              Season {tournament.season} · {isCricket ? "Cricket Championship" : "Football League"}
            </p>
          </div>

          {/* Rules Badges */}
          <div className="flex flex-wrap gap-1.5">
            {isCricket ? (
              <>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  🏏 {rules.overs || 10} Overs
                </span>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  ⚡ {rules.powerplay || 2} Ov Powerplay
                </span>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  🏆 Win: {rules.pointsWin || 2} pts
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  ⚽ {rules.halfMinutes || 20} Mins/Half
                </span>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  👥 {rules.format || "7-a-side"}
                </span>
                <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  🏆 Win: {rules.pointsWin || 3} pts
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card Footer: Metrics & Enter Action */}
        <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 text-xs font-bold text-[#7C6E63]">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>{tournament.teamsCount || 0} Teams</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>{tournament.matchesCount || 0} Matches</span>
            </span>
          </div>

          <Link
            to={`/tournaments/${tournament.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white font-extrabold text-xs shadow-md shadow-[#9E2A2B]/20 transition-all hover:scale-102"
          >
            <span>Enter Arena</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
};
