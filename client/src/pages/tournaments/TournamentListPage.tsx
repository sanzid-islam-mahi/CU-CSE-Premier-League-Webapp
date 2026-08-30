import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Loader2
} from "lucide-react";
import { api, type TournamentItem } from "@/lib/api";
import { TournamentCard } from "@/components/tournaments/TournamentCard";

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
            {filteredTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}

      </main>

    </div>
  );
};
