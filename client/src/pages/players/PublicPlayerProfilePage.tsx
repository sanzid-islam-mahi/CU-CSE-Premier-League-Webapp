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
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col pb-20">
      
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

          {player.batch && (
            <Link
              to={`/batches/${player.batch.slug || `batch-${player.batch.id}`}`}
              className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3] hover:bg-[#FAF7F2] transition-colors"
            >
              🏛️ {player.batch.name}
            </Link>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Hero */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] shadow-sm overflow-hidden relative">
          
          {/* Cover Photo */}
          <div className="relative h-44 sm:h-60 w-full bg-[#FAF0E6] overflow-hidden group">
            {player.coverUrl ? (
              <img
                src={player.coverUrl}
                alt={`${player.name} Cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#9E2A2B] via-[#842021] to-[#2C221E] flex items-center justify-center text-white/40">
                <span className="text-xs font-bold uppercase tracking-wider">CU CSE Premier League Athlete</span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Profile Header Body */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
            
            {/* Top Row: Avatar & Jersey Pill */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
              <SmartAvatar
                src={player.avatarUrl}
                alt={player.name}
                size="2xl"
                shape="rounded"
                className="ring-4 ring-white shadow-xl shrink-0"
              />

              {/* Jersey Pill */}
              {player.preferredJerseyNo && (
                <div className="p-3 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center gap-2 self-center sm:self-end">
                  <Shirt className="w-5 h-5 text-[#9E2A2B]" />
                  <div>
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Squad Number</p>
                    <p className="font-black text-sm text-[#9E2A2B]">#{player.preferredJerseyNo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info Details - Cleanly situated below cover */}
            <div className="mt-5 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                  {player.name}
                </h1>
                <span className="font-mono text-xs font-black bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  Roll: {player.studentId}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#7C6E63] font-semibold pt-0.5">
                {player.batch && (
                  <Link
                    to={`/batches/${player.batch.slug || `batch-${player.batch.id}`}`}
                    className="hover:underline font-bold text-[#842021] bg-[#FAF0E6] px-2.5 py-1 rounded-lg border border-[#E8D6C3] transition-colors"
                  >
                    🏛️ {player.batch.name} ({player.batch.session})
                  </Link>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8DCCF]">
                  <span>📧</span>
                  <span className="font-mono">{player.email}</span>
                </span>
                {player.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8DCCF]">
                      <span>📞</span>
                      <span className="font-mono">{player.phone}</span>
                    </span>
                  </>
                )}
              </div>

              {player.bio && (
                <div className="pt-2">
                  <p className="text-xs text-[#4A3E35] font-medium italic bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DCCF] max-w-2xl">
                    "{player.bio}"
                  </p>
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

        {/* Player Photo Album */}
        {player.id && (
          <div className="pt-2">
            <MediaGalleryView
              userId={player.id}
              title={`${player.name}'s Match Gallery & Moments`}
              description="Moments captured during CSEPL tournaments and match days."
              allowUpload={false}
            />
          </div>
        )}

      </main>

    </div>
  );
};
