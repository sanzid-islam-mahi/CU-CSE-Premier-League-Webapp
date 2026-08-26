import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Users, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  Shirt 
} from "lucide-react";
import { api } from "@/lib/api";

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.teams.get(Number(id));
        setTeam(data);
      } catch (err: any) {
        console.error("Failed to load team", err);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-[#6B5E53]">
          <Loader2 className="w-5 h-5 animate-spin text-[#9E2A2B]" />
          <span>Loading team roster...</span>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center border border-[#E8D6C3]">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#2C221E]">Team Not Found</h2>
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Top Header */}
      <div className="bg-white border-b border-[#E5DACB] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to={team.tournament ? `/tournaments/${team.tournament.slug}` : "/"}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {team.tournament ? team.tournament.name : "Tournament"}</span>
          </Link>

          <span className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
            {team.batch ? `${team.batch.name} (${team.batch.session})` : "Department Squad"}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Hero */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pt-2">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-20 h-20 rounded-3xl brick-gradient text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#9E2A2B]/20 border-2 border-[#842021] shrink-0">
                {team.shortName || team.name.slice(0, 2)}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                    {team.name}
                  </h1>
                  <span className="font-mono text-xs font-black bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                    {team.shortName}
                  </span>
                </div>

                <p className="text-xs text-[#7C6E63]">
                  {team.batch ? `🏛️ ${team.batch.name} · Session ${team.batch.session}` : "Independent Campus Team"} · {team.members?.length || 0} Registered Players
                </p>

                {team.tournament && (
                  <p className="text-xs text-[#9E2A2B] font-extrabold pt-1">
                    🏆 Participating in: {team.tournament.name} ({team.tournament.sport})
                  </p>
                )}
              </div>
            </div>

            {/* Captain Pill */}
            {team.captain && (
              <div className="p-4 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center gap-3">
                <span className="text-xl">👑</span>
                <div>
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Team Captain</p>
                  <p className="font-extrabold text-sm text-[#842021]">{team.captain.name}</p>
                  <Link
                    to={`/players/${team.captain.studentId}`}
                    className="text-[10px] text-[#9E2A2B] hover:underline"
                  >
                    Roll: {team.captain.studentId} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Squad Roster Grid */}
        <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-[#9E2A2B]" />
              <h2 className="text-base font-black text-[#2C221E]">
                Official Squad Roster ({team.members?.length || 0})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {team.members?.map((m: any, idx: number) => (
              <Link
                key={m.userId}
                to={`/players/${m.user.studentId}`}
                className="p-3.5 bg-[#FAF7F2] hover:bg-[#FAF0E6] rounded-2xl border border-[#E8DCCF] hover:border-[#E8D6C3] flex items-center justify-between transition-colors group text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-[#9E2A2B] font-mono font-black text-xs flex items-center justify-center border border-[#E8D6C3] shrink-0">
                    #{m.jerseyNumber || m.user.preferredJerseyNo || (idx + 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-[#2C221E] group-hover:text-[#9E2A2B]">
                        {m.user.name}
                      </p>
                      {m.isCaptain && <span className="text-[11px]" title="Captain">👑</span>}
                    </div>
                    <p className="text-[10px] text-[#7C6E63] font-mono">Roll: {m.user.studentId}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#6B5E53] bg-white px-2 py-0.5 rounded border border-[#E8DCCF]">
                    {team.tournament?.sport === "CRICKET" ? (m.user.cricketRole || "Player") : (m.user.footballPosition || "Player")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Team Match Fixtures */}
        {(team.homeMatches?.length > 0 || team.awayMatches?.length > 0) && (
          <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-[#2C221E] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#9E2A2B]" />
              <span>Team Fixtures & Match History</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[...(team.homeMatches || []), ...(team.awayMatches || [])].map((m: any) => (
                <div key={m.id} className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#7C6E63]">
                    <span className="font-bold text-[#9E2A2B]">Match #{m.matchNumber}</span>
                    <span className="font-bold text-[#2A7B54]">{m.status}</span>
                  </div>
                  <div className="flex items-center justify-between font-extrabold text-sm text-[#2C221E]">
                    <span>{m.teamA?.name || team.name}</span>
                    <span className="text-xs text-[#9E2A2B] bg-[#FAF0E6] px-2 py-0.5 rounded font-mono">VS</span>
                    <span>{m.teamB?.name || team.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#7C6E63] pt-1 border-t border-[#EFE8DC]">
                    <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                    <span>{m.venue || "CU Ground"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
