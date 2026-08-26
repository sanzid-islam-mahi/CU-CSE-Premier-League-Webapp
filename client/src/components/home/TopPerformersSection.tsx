import React from "react";
import { Zap } from "lucide-react";

interface TopPerformersSectionProps {
  activeSport: "cricket" | "football";
}

export const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ activeSport }) => {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B] mb-1">
              <Zap className="w-4 h-4" />
              <span>Department Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
              {activeSport === "cricket" ? "Orange & Purple Cap Leaders" : "Golden Boot & Playmaker Leaders"}
            </h2>
          </div>
          <span className="text-xs text-[#7C6E63] font-semibold hidden sm:inline-block">
            Updated live after every ball & event
          </span>
        </div>

        {/* Cricket Leaders */}
        {activeSport === "cricket" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Orange Cap (Most Runs) */}
            <div className="bg-gradient-to-br from-[#FFF5EC] to-white rounded-3xl border-2 border-[#D96B27]/40 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#D96B27] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  🧢 ORANGE CAP
                </span>
                <span className="text-xs font-bold text-[#D96B27]">Most Runs</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Sanzid</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 20 Titans · Captain</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#D96B27]">186</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Total Runs (4 Inngs)</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">HS: <strong className="text-[#D96B27]">74*</strong></p>
                  <p className="font-semibold text-[#2C221E]">SR: <strong className="text-[#D96B27]">218.8</strong></p>
                  <p className="text-[11px] text-[#7C6E63]">18x4, 11x6</p>
                </div>
              </div>
            </div>

            {/* Purple Cap (Most Wickets) */}
            <div className="bg-gradient-to-br from-[#FAF0FF] to-white rounded-3xl border-2 border-[#6B4E71]/40 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#6B4E71] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  🧢 PURPLE CAP
                </span>
                <span className="text-xs font-bold text-[#6B4E71]">Most Wickets</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Farhan</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 21 Warriors · Fast Bowler</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#6B4E71]">9</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Wickets (8.4 Overs)</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">BBI: <strong className="text-[#6B4E71]">4/14</strong></p>
                  <p className="font-semibold text-[#2C221E]">Econ: <strong className="text-[#6B4E71]">6.12</strong></p>
                  <p className="text-[11px] text-[#7C6E63]">Avg: 5.77</p>
                </div>
              </div>
            </div>

            {/* Maximum Sixes Trophy */}
            <div className="bg-gradient-to-br from-[#FAF0E6] to-white rounded-3xl border-2 border-[#9E2A2B]/30 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#9E2A2B] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  💥 MAXIMUM SIXES
                </span>
                <span className="text-xs font-bold text-[#9E2A2B]">Power Striker</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Tanvir</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 21 Warriors · All-Rounder</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#9E2A2B]">14</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Total Sixes Hit</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">Strike Rate: <strong className="text-[#9E2A2B]">235.4</strong></p>
                  <p className="text-[11px] text-[#7C6E63]">Longest: 88m</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Football Leaders */}
        {activeSport === "football" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Golden Boot (Top Scorer) */}
            <div className="bg-gradient-to-br from-[#FFF9DB] to-white rounded-3xl border-2 border-[#F59F00]/50 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#F59F00] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  👟 GOLDEN BOOT
                </span>
                <span className="text-xs font-bold text-[#D97706]">Top Scorer</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Rafid</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 21 Strikers · Forward</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#D97706]">6</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Goals in 3 Matches</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">Hat-tricks: <strong className="text-[#D97706]">1</strong></p>
                  <p className="font-semibold text-[#2C221E]">Mins/Goal: <strong className="text-[#D97706]">20'</strong></p>
                </div>
              </div>
            </div>

            {/* Top Playmaker (Assists) */}
            <div className="bg-gradient-to-br from-[#E6FCF5] to-white rounded-3xl border-2 border-[#20C997]/40 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#20C997] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  🎯 TOP PLAYMAKER
                </span>
                <span className="text-xs font-bold text-[#0CA678]">Most Assists</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Sami</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 21 Strikers · Midfield Maestro</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#0CA678]">5</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Assists Provided</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">Chances: <strong className="text-[#0CA678]">14</strong></p>
                  <p className="font-semibold text-[#2C221E]">Key Passes: <strong className="text-[#0CA678]">9</strong></p>
                </div>
              </div>
            </div>

            {/* Golden Glove (Clean Sheets) */}
            <div className="bg-gradient-to-br from-[#E7F5FF] to-white rounded-3xl border-2 border-[#339AF0]/40 p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#339AF0] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  🧤 GOLDEN GLOVE
                </span>
                <span className="text-xs font-bold text-[#1C7ED6]">Best Goalkeeper</span>
              </div>

              <div className="space-y-1 my-3">
                <h3 className="text-2xl font-black text-[#2C221E]">Nahian</h3>
                <p className="text-xs font-bold text-[#9E2A2B]">Batch 20 Tigers · Goalkeeper</p>
              </div>

              <div className="my-5 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-[#1C7ED6]">2</p>
                  <p className="text-[11px] font-semibold text-[#7C6E63]">Clean Sheets</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-semibold text-[#2C221E]">Saves: <strong className="text-[#1C7ED6]">18</strong></p>
                  <p className="font-semibold text-[#2C221E]">Save %: <strong className="text-[#1C7ED6]">90%</strong></p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
