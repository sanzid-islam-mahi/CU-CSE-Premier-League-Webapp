import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Shield, 
  ArrowLeft, 
  Loader2, 
  User, 
  Shirt
} from "lucide-react";
import { api } from "@/lib/api";

export const PublicPlayerProfilePage: React.FC = () => {
  const { idOrRoll } = useParams<{ idOrRoll: string }>();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!idOrRoll) return;
      try {
        setLoading(true);
        const data = await api.users.getPublicProfile(idOrRoll);
        setPlayer(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [idOrRoll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-[#6B5E53]">
          <Loader2 className="w-5 h-5 animate-spin text-[#9E2A2B]" />
          <span>Loading player profile...</span>
        </div>
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center border border-[#E8D6C3]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#2C221E]">Player Not Found</h2>
        <p className="text-xs text-[#7C6E63] max-w-sm">
          The requested student ID or player profile could not be found in the CSE Department registry.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] text-white font-bold text-xs"
        >
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CSEPL Home</span>
          </Link>

          <span className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
            {player.batch ? player.batch.name : "CSE Department Roster"}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Hero */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left pt-2">
            
            <div className="w-24 h-24 rounded-3xl brick-gradient text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#9E2A2B]/20 border-2 border-[#842021] shrink-0">
              {player.name.charAt(0)}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                  {player.name}
                </h1>
                <span className="font-mono text-xs font-black bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  Roll: {player.studentId}
                </span>
              </div>

              <p className="text-xs text-[#7C6E63] font-medium flex items-center justify-center sm:justify-start gap-3">
                <span>🏛️ {player.batch ? `${player.batch.name} (${player.batch.session})` : "CSE CU"}</span>
                <span>•</span>
                <span>📧 {player.email}</span>
              </p>

              <p className="text-xs text-[#4A3E35] font-medium italic pt-1 max-w-xl">
                "{player.bio || "CSE Chittagong University Premier League Athlete"}"
              </p>
            </div>

            {/* Jersey Pill */}
            {player.preferredJerseyNo && (
              <div className="p-3 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center gap-2 self-center sm:self-start">
                <Shirt className="w-5 h-5 text-[#9E2A2B]" />
                <div>
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Jersey</p>
                  <p className="font-black text-sm text-[#9E2A2B]">#{player.preferredJerseyNo}</p>
                </div>
              </div>
            )}

          </div>

          {/* Active Tournament Organizers Badge */}
          {player.organizerTournaments?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#EFE8DC]">
              <div className="p-3.5 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#9E2A2B]" />
                <p className="text-xs text-[#2C221E] font-bold">
                  Designated Tournament Organizer for: <span className="text-[#842021]">{player.organizerTournaments.map((t: any) => t.name).join(", ")}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sports Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cricket Card */}
          <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏏</span>
                <h3 className="text-base font-black text-[#2C221E]">Cricket Style</h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                {player.cricketRole || "🏏 Player"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Batting Style</p>
                <p className="font-extrabold text-[#2C221E] mt-0.5">{player.battingStyle || "Right Hand Bat"}</p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Bowling Style</p>
                <p className="font-extrabold text-[#2C221E] mt-0.5">{player.bowlingStyle || "Right-arm Fast"}</p>
              </div>
            </div>
          </div>

          {/* Football Card */}
          <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <h3 className="text-base font-black text-[#2C221E]">Football Position</h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                {player.footballPosition || "⚽ Forward"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Preferred Position</p>
                <p className="font-extrabold text-[#2C221E] mt-0.5">{player.footballPosition || "Forward / Striker"}</p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Squad Number</p>
                <p className="font-extrabold text-[#9E2A2B] mt-0.5 text-base">
                  #{player.preferredJerseyNo || "10"}
                </p>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
