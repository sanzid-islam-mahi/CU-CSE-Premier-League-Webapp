import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowUpRight, Loader2 } from "lucide-react";
import { api, type TournamentItem } from "@/lib/api";
import { TournamentCard } from "@/components/tournaments/TournamentCard";

export const TournamentsSection: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.tournaments.getAll();
        setTournaments(data.slice(0, 3));
      } catch (err: any) {
        console.error("Failed to load featured tournaments", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        {loading ? (
          <div className="p-12 text-center text-[#7C6E63] flex items-center justify-center gap-2 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-[#9E2A2B]" />
            <span>Loading championships arena...</span>
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-[#E5DACB] text-center text-xs text-[#7C6E63]">
            No tournaments currently listed.
          </div>
        )}

      </div>
    </section>
  );
};
