import React from "react";
import { Trophy, Users, Shield, Activity } from "lucide-react";

interface HeroSectionProps {
  activeSport: "cricket" | "football";
  onSelectSport: (sport: "cricket" | "football") => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ activeSport, onSelectSport }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-12">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9E2A2B]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-[#D96B27]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          
          {/* Department Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0E6] border border-[#E8D6C3] text-[#842021] text-xs font-bold shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-[#9E2A2B] animate-pulse" />
            <span>University of Chittagong · Department of CSE</span>
            <span className="bg-[#9E2A2B] text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              SEASON 2026
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#2C221E] tracking-tight leading-[1.15]">
            Where <span className="text-[#9E2A2B] underline decoration-[#9E2A2B]/20 decoration-wavy">Red Bricks</span> Meet Code & Champions
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#6B5E53] leading-relaxed max-w-2xl mx-auto">
            The official tournament management & live scoring system for CSE Department. 
            Experience live ball-by-ball cricket, minute-by-minute football thrill, 
            academic batch rivalries, and player leaderboards.
          </p>

          {/* Sport Selector Chips */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onSelectSport("cricket")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                activeSport === "cricket"
                  ? "bg-[#9E2A2B] text-white shadow-lg shadow-[#9E2A2B]/25 scale-105"
                  : "bg-white text-[#4A3E35] border border-[#E0D4C3] hover:border-[#9E2A2B] hover:bg-[#FAF0E6]"
              }`}
            >
              <span>🏏</span>
              <span>Cricket Mode (CPL T10)</span>
            </button>

            <button
              onClick={() => onSelectSport("football")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                activeSport === "football"
                  ? "bg-[#9E2A2B] text-white shadow-lg shadow-[#9E2A2B]/25 scale-105"
                  : "bg-white text-[#4A3E35] border border-[#E0D4C3] hover:border-[#9E2A2B] hover:bg-[#FAF0E6]"
              }`}
            >
              <span>⚽</span>
              <span>Football Mode (Futsal Cup)</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#2C221E]">8 Batches</p>
              <p className="text-xs text-[#7C6E63]">18th to 25th + Faculty</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#2C221E]">140+ Players</p>
              <p className="text-xs text-[#7C6E63]">Department Registered</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#2C221E]">2 Active Leagues</p>
              <p className="text-xs text-[#7C6E63]">Cricket T10 & Futsal Cup</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#2C221E]">1 Match Live</p>
              <p className="text-xs text-[#7C6E63]">Ball-by-ball Broadcast</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
