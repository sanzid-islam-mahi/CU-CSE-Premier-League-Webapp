import React from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowUpRight } from "lucide-react";
import { DummyBadge } from "@/components/common/DummyBadge";

export const TournamentsSection: React.FC = () => {
  const tournaments = [
    {
      id: 1,
      slug: "cpl-2026-cricket-t10",
      name: "CSE Premier League 2026",
      sport: "Cricket (T10)",
      season: "Spring 2026",
      status: "ONGOING",
      teamsCount: 6,
      matchesTotal: 15,
      matchesPlayed: 7,
      description: "The marquee annual cricket extravaganza of CU CSE. Batches battling in a tape-tennis 10-over powerplay format.",
      icon: "🏏",
      accent: "from-[#9E2A2B] to-[#731D1E]",
      organizers: ["Sanzid (Anabil 21)", "Tanvir (Anabil 21)"],
    },
    {
      id: 2,
      slug: "cse-futsal-champions-cup-2026",
      name: "CSE Futsal Champions Cup 2026",
      sport: "Football (7-a-side)",
      season: "Summer 2026",
      status: "ONGOING",
      teamsCount: 6,
      matchesTotal: 12,
      matchesPlayed: 5,
      description: "High-octane 7-a-side futsal tournament with group stages and knockout matches under the floodlights.",
      icon: "⚽",
      accent: "from-[#8B2324] to-[#601415]",
      organizers: ["Rafid (Dwimik 22)", "Nahid (Dwimik 22)"],
    },
    {
      id: 3,
      slug: "cpl-2026-cricket-t10",
      name: "CSE Super Sixes 2025",
      sport: "Cricket (6 Overs)",
      season: "Fall 2025",
      status: "COMPLETED",
      teamsCount: 6,
      matchesTotal: 10,
      matchesPlayed: 10,
      description: "Championship concluded! Anabil 21 emerged victorious after a thrilling final against Batch 20.",
      icon: "🏆",
      accent: "from-[#2C221E] to-[#1C1613]",
      organizers: ["CSE Dept Sports Committee"],
      champion: "Anabil 21 Titans",
    }
  ];

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B] mb-1">
              <Trophy className="w-4 h-4" />
              <span>Tournaments Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
              Championships & Leagues
            </h2>
          </div>

          <Link 
            to="/tournaments" 
            className="text-xs font-bold text-[#9E2A2B] hover:underline flex items-center gap-1"
          >
            <span>Explore All Tournaments</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              to={`/tournaments/${t.slug}`}
              className="bg-white rounded-3xl border border-[#E5DACB] hover:border-[#9E2A2B] p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl p-2.5 rounded-2xl bg-[#FAF0E6] border border-[#E8D6C3]">
                    {t.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.id === 3 && <DummyBadge label="SAMPLE ARCHIVE" variant="subtle" />}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        t.status === "ONGOING"
                          ? "bg-[#9E2A2B] text-white animate-pulse"
                          : "bg-[#EFE8DC] text-[#6B5E53]"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors leading-snug">
                  {t.name}
                </h3>
                
                <p className="text-xs font-bold text-[#842021] mt-1 mb-3">
                  {t.sport} · <span className="text-[#7C6E63]">{t.season}</span>
                </p>

                <p className="text-xs text-[#6B5E53] leading-relaxed line-clamp-3 mb-4">
                  {t.description}
                </p>

                {t.champion && (
                  <div className="mb-4 p-2.5 bg-[#FFF9DB] rounded-xl border border-[#F59F00] text-xs font-bold text-[#7E4D00] flex items-center gap-1.5">
                    <span>👑 Champion:</span>
                    <span className="text-[#2C221E]">{t.champion}</span>
                  </div>
                )}
              </div>

              {/* Progress & Organizers */}
              <div className="pt-4 border-t border-[#EFE8DC] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B5E53]">
                  <span>Matches: {t.matchesPlayed}/{t.matchesTotal}</span>
                  <span>{t.teamsCount} Teams</span>
                </div>

                <div className="w-full bg-[#EFE8DC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#9E2A2B] h-full rounded-full transition-all"
                    style={{ width: `${(t.matchesPlayed / t.matchesTotal) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#7C6E63]">
                  <span className="truncate">Organizers: {t.organizers.join(", ")}</span>
                  <span className="text-[#9E2A2B] font-bold shrink-0 flex items-center group-hover:translate-x-0.5 transition-transform">
                    View Arena <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>

            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
