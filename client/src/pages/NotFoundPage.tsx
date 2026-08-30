import React from "react";
import { Link } from "react-router-dom";
import { Home, Trophy, Users, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col justify-between">
      <Navbar activeSport="cricket" onSelectSport={() => {}} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden w-full">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          {/* Icon / 404 Emblem */}
          <div className="relative inline-block">
            <div className="text-7xl sm:text-8xl select-none animate-bounce">
              🏏
            </div>
            <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-[#9E2A2B] text-white text-xs font-black rounded-full border-2 border-white shadow-md uppercase tracking-wider">
              404 Out
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#9E2A2B] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
              Page Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#2C221E] tracking-tight pt-1">
              Out of the Ground!
            </h1>
            <p className="text-xs sm:text-sm text-[#7C6E63] max-w-md mx-auto leading-relaxed">
              The page or match record you are looking for does not exist, has been moved, or was cleanly bowled out.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EFE8DC]">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-black shadow-md shadow-[#9E2A2B]/20 transition-all hover:scale-102"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <Link
              to="/tournaments"
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#FAF0E6] hover:bg-[#F3E5D8] text-[#842021] border border-[#E8D6C3] text-xs font-black shadow-xs transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>Tournaments Hub</span>
            </Link>

            <Link
              to="/batches/batch-21"
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#2C221E] border border-[#E5DACB] text-xs font-black shadow-xs transition-all"
            >
              <Users className="w-4 h-4 text-[#7C6E63]" />
              <span>Batch Showcase</span>
            </Link>
          </div>

          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C6E63] hover:text-[#9E2A2B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back to Previous Page</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
