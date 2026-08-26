import React from "react";
import { Radio, Clock, MapPin } from "lucide-react";
import { DummyBadge } from "@/components/common/DummyBadge";

interface LiveMatchCardsProps {
  activeSport: "cricket" | "football";
}

export const LiveMatchCards: React.FC<LiveMatchCardsProps> = ({ activeSport }) => {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9E2A2B] text-white text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Match Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
              {activeSport === "cricket" ? "Cricket Fixtures & Live Score" : "Football Fixtures & Live Match"}
            </h2>
            <DummyBadge label="SHOWCASE PREVIEW" variant="warning" />
          </div>
          
          <span className="text-xs font-semibold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E5DACB]">
            CU Science Faculty Ground
          </span>
        </div>

        {/* Cricket Live Card */}
        {activeSport === "cricket" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Featured Live Match Box */}
            <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-[#9E2A2B]/30 p-6 shadow-md shadow-[#9E2A2B]/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#9E2A2B] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                LIVE · 2nd INNINGS
              </div>

              {/* Tournament Info */}
              <div className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>CSE Premier League 2026</span>
                <span>•</span>
                <span className="text-[#9E2A2B]">Group A · Match 4</span>
                <span>•</span>
                <span>T10 (10 Overs)</span>
                <DummyBadge label="SAMPLE MATCH" />
              </div>

              {/* Teams & Scoreboard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#EFE8DC]">
                {/* Team 1: Batch 20 (1st Innings) */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCF]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7C6E63]">Batting 1st</span>
                    <span className="text-[11px] font-semibold text-[#6B5E53]">10.0 ov</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-black text-xs">
                        B20
                      </div>
                      <span className="font-extrabold text-[#2C221E] text-base">Batch 20 Titans</span>
                    </div>
                    <span className="text-xl font-black text-[#2C221E]">104<span className="text-sm font-bold text-[#7C6E63]">/5</span></span>
                  </div>
                </div>

                {/* Team 2: Batch 21 (Chasing) */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FBEFE9] border-2 border-[#9E2A2B]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#9E2A2B] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9E2A2B]" /> Batting Now
                    </span>
                    <span className="text-[11px] font-bold text-[#842021]">7.4 / 10 ov</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2C221E] text-white flex items-center justify-center font-black text-xs">
                        B21
                      </div>
                      <span className="font-extrabold text-[#2C221E] text-base">Batch 21 Warriors</span>
                    </div>
                    <span className="text-xl font-black text-[#9E2A2B]">81<span className="text-sm font-bold text-[#842021]">/3</span></span>
                  </div>
                </div>
              </div>

              {/* Equation Banner */}
              <div className="py-3 px-4 my-4 rounded-xl bg-[#FAF0E6] border border-[#E8D6C3] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#842021]">
                <span>🎯 Equation: Batch 21 need 24 runs from 14 balls</span>
                <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-md border border-[#D8C7B3]">
                  RRR: 10.28
                </span>
              </div>

              {/* Live Players Spotlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-xl space-y-1.5">
                  <p className="font-bold text-[#7C6E63] text-[11px] uppercase">Batting at Crease</p>
                  <div className="flex justify-between font-semibold text-[#2C221E]">
                    <span>🏏 Sanzid* (c)</span>
                    <span className="font-mono text-[#9E2A2B]">34 (18) [4x4, 2x6]</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E53]">
                    <span>Tanvir</span>
                    <span className="font-mono">12 (7) [1x4]</span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl space-y-1.5">
                  <p className="font-bold text-[#7C6E63] text-[11px] uppercase">Current Bowler</p>
                  <div className="flex justify-between font-semibold text-[#2C221E]">
                    <span>🎯 Farhan (Right-arm Fast)</span>
                    <span className="font-mono text-[#9E2A2B]">1.4-0-18-1</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#7C6E63]">This Over:</span>
                    <div className="flex gap-1 font-mono text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 bg-white rounded border border-[#E5DACB]">1</span>
                      <span className="px-1.5 py-0.5 bg-[#FBEFE9] text-[#9E2A2B] rounded border border-[#9E2A2B]/30">4</span>
                      <span className="px-1.5 py-0.5 bg-white rounded border border-[#E5DACB]">0</span>
                      <span className="px-1.5 py-0.5 bg-[#9E2A2B] text-white rounded">W</span>
                      <span className="px-1.5 py-0.5 bg-[#FBEFE9] text-[#9E2A2B] rounded border border-[#9E2A2B]/30">6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Cricket Match Card */}
            {/* Upcoming Cricket Match Box */}
            <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] text-[11px] font-bold">
                      UPCOMING TODAY
                    </span>
                    <DummyBadge label="SAMPLE" />
                  </div>
                  <span className="text-xs text-[#7C6E63] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#9E2A2B]" /> 4:30 PM
                  </span>
                </div>

                <p className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4">
                  Group B · Match 5
                </p>

                <div className="space-y-4 my-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs">
                        B22
                      </div>
                      <span className="font-bold text-[#2C221E] text-sm">Batch 22 Royals</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7C6E63]">Squad Ready</span>
                  </div>

                  <div className="text-center font-extrabold text-xs text-[#9E2A2B]">VS</div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#2C221E] text-white flex items-center justify-center font-bold text-xs">
                        B23
                      </div>
                      <span className="font-bold text-[#2C221E] text-sm">Batch 23 Challengers</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7C6E63]">Squad Ready</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  <span>CU Science Faculty Ground</span>
                </div>
                <span className="font-semibold text-[#9E2A2B]">Toss in 45m</span>
              </div>
            </div>

          </div>
        )}

        {/* Football Live Card */}
        {activeSport === "football" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Featured Live Football Box */}
            <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-[#9E2A2B]/30 p-6 shadow-md shadow-[#9E2A2B]/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#9E2A2B] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                LIVE · 2nd HALF (34')
              </div>

              {/* Tournament Info */}
              <div className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>CSE Futsal Cup 2026</span>
                <span>•</span>
                <span className="text-[#9E2A2B]">Quarter Final 1</span>
                <span>•</span>
                <span>20 Min Halves</span>
                <DummyBadge label="SAMPLE MATCH" />
              </div>

              {/* Football Score Big Display */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCF] mb-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Team A */}
                  <div className="flex-1 text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#9E2A2B] text-white flex items-center justify-center font-black text-sm mx-auto shadow-sm">
                      B21
                    </div>
                    <p className="font-extrabold text-[#2C221E] text-base">Batch 21 Strikers</p>
                    <p className="text-[11px] text-[#7C6E63]">Goals: Rafid 12', Nahid 28'</p>
                  </div>

                  {/* Score */}
                  <div className="px-6 py-3 rounded-2xl bg-white border-2 border-[#9E2A2B]/30 shadow-xs text-center">
                    <span className="text-3xl sm:text-4xl font-black text-[#9E2A2B] tracking-widest font-mono">
                      2 - 1
                    </span>
                    <p className="text-[10px] font-bold text-[#842021] uppercase tracking-wider mt-1">
                      Time: 34:12
                    </p>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#2C221E] text-white flex items-center justify-center font-black text-sm mx-auto shadow-sm">
                      B22
                    </div>
                    <p className="font-extrabold text-[#2C221E] text-base">Batch 22 United</p>
                    <p className="text-[11px] text-[#7C6E63]">Goal: Shakil 19'</p>
                  </div>
                </div>
              </div>

              {/* Match Events Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider">Live Match Events</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E5DACB] text-[#2C221E] font-medium flex items-center gap-1">
                    ⚽ 12' Goal by <strong>Rafid (B21)</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E5DACB] text-[#2C221E] font-medium flex items-center gap-1">
                    ⚽ 19' Goal by <strong>Shakil (B22)</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-[#FFF9DB] rounded-lg border border-[#F59F00] text-[#7E4D00] font-medium flex items-center gap-1">
                    🟨 24' Yellow: <strong>Nahid (B21)</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-[#FBEFE9] rounded-lg border border-[#9E2A2B]/30 text-[#842021] font-bold flex items-center gap-1">
                    ⚽ 28' Goal by <strong>Nahid (B21)</strong> [Assist: Sami]
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Football Match */}
            <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] text-[11px] font-bold">
                      UPCOMING TOMORROW
                    </span>
                    <DummyBadge label="SAMPLE" />
                  </div>
                  <span className="text-xs text-[#7C6E63] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#9E2A2B]" /> 11:00 AM
                  </span>
                </div>

                <p className="text-xs font-bold text-[#7C6E63] uppercase tracking-wider mb-4">
                  Quarter Final 2
                </p>

                <div className="space-y-4 my-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs">
                        B20
                      </div>
                      <span className="font-bold text-[#2C221E] text-sm">Batch 20 Tigers</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7C6E63]">Lineup Set</span>
                  </div>

                  <div className="text-center font-extrabold text-xs text-[#9E2A2B]">VS</div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DCCF]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#2C221E] text-white flex items-center justify-center font-bold text-xs">
                        B23
                      </div>
                      <span className="font-bold text-[#2C221E] text-sm">Batch 23 Warriors</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7C6E63]">Lineup Set</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  <span>CU Central Gymnasium Field</span>
                </div>
                <span className="font-semibold text-[#9E2A2B]">Futsal Rules</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
