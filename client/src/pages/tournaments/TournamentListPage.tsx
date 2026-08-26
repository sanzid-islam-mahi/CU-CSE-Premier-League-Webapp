import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Users, 
  ArrowRight
} from "lucide-react";
import { api, type TournamentItem } from "@/lib/api";

export const TournamentListPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<"ALL" | "CRICKET" | "FOOTBALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        const data = await api.tournaments.getAll();
        setTournaments(data);
      } catch (err: any) {
        console.error("Failed to load tournaments", err);
      } finally {
        setLoading(false);
      }
    };
    loadTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(t => {
    if (selectedSport !== "ALL" && t.sport !== selectedSport) return false;
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-[#E5DACB] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CSEPL Home</span>
          </Link>

          <span className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
            CU CSE Tournaments
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                  CSEPL Tournaments Hub
                </h1>
              </div>
              <p className="text-xs text-[#7C6E63] max-w-xl">
                Official Cricket and Football championship arenas of the Department of Computer Science & Engineering, University of Chittagong.
              </p>
            </div>

            {/* Filter Toggle Bars */}
            <div className="flex flex-wrap gap-2">
              {/* Sport Filter */}
              <div className="flex items-center bg-[#FAF7F2] p-1 rounded-2xl border border-[#D8C7B3]">
                <button
                  onClick={() => setSelectedSport("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedSport === "ALL" ? "bg-[#9E2A2B] text-white shadow-xs" : "text-[#7C6E63]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedSport("CRICKET")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedSport === "CRICKET" ? "bg-[#9E2A2B] text-white shadow-xs" : "text-[#7C6E63]"
                  }`}
                >
                  🏏 Cricket
                </button>
                <button
                  onClick={() => setSelectedSport("FOOTBALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedSport === "FOOTBALL" ? "bg-[#9E2A2B] text-white shadow-xs" : "text-[#7C6E63]"
                  }`}
                >
                  ⚽ Football
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-[#FAF7F2] p-1 rounded-2xl border border-[#D8C7B3]">
                <button
                  onClick={() => setSelectedStatus("ALL")}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedStatus === "ALL" ? "bg-[#842021] text-white" : "text-[#7C6E63]"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setSelectedStatus("ONGOING")}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedStatus === "ONGOING" ? "bg-[#842021] text-white" : "text-[#7C6E63]"
                  }`}
                >
                  Ongoing
                </button>
                <button
                  onClick={() => setSelectedStatus("UPCOMING")}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedStatus === "UPCOMING" ? "bg-[#842021] text-white" : "text-[#7C6E63]"
                  }`}
                >
                  Upcoming
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="p-12 text-center text-[#7C6E63] flex items-center justify-center gap-2 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-[#9E2A2B]" />
            <span>Loading tournaments catalog...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTournaments.map((t) => {
              const rules = t.rules || {};
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl border-2 border-[#E5DACB] hover:border-[#9E2A2B] p-6 shadow-xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">
                        {t.sport === "CRICKET" ? "🏏" : "⚽"}
                      </span>
                      <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                        {t.status}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors">
                        {t.name}
                      </h2>
                      <p className="text-xs text-[#7C6E63]">
                        Season {t.season} · {t.sport === "CRICKET" ? "Cricket Championship" : "Football League"}
                      </p>
                    </div>

                    {/* Rules Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.sport === "CRICKET" ? (
                        <>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#842021] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            🏏 {rules.overs || 10} Overs
                          </span>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            ⚡ {rules.powerplay || 2} Ov Powerplay
                          </span>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            🏆 Win: {rules.pointsWin || 2} pts
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#842021] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            ⚽ {rules.halfMinutes || 20} Mins / Half
                          </span>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            👥 {rules.format || "7-a-side"}
                          </span>
                          <span className="text-[11px] font-bold bg-[#FAF7F2] text-[#6B5E53] px-2 py-0.5 rounded-lg border border-[#E8D6C3]">
                            🏆 Win: {rules.pointsWin || 3} pts
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EFE8DC] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-[#7C6E63]">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#9E2A2B]" />
                        <span>{t.teamsCount || 0} Teams</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-[#9E2A2B]" />
                        <span>{t.matchesCount || 0} Matches</span>
                      </span>
                    </div>

                    <Link
                      to={`/tournaments/${t.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs shadow-md shadow-[#9E2A2B]/20 transition-all"
                    >
                      <span>Enter Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
};
