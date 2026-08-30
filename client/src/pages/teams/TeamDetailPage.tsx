import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Users, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  Shirt,
  Camera,
  Upload
} from "lucide-react";
import { api } from "@/lib/api";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { ImageUploadModal } from "@/components/common/ImageUploadModal";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const currentUser = api.auth.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const isCaptain = currentUser?.id === team?.captainId;
  const canEdit = isAdmin || isCaptain;

  useEffect(() => {
    loadTeam();
  }, [id]);

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

  const handleUpdateBanner = async (url: string) => {
    try {
      await api.teams.update(team.id, { bannerUrl: url });
      setTeam((prev: any) => ({ ...prev, bannerUrl: url }));
    } catch (err: any) {
      alert(err.message || "Failed to update team banner.");
    }
  };

  const handleUpdateLogo = async (url: string) => {
    try {
      await api.teams.update(team.id, { logoUrl: url });
      setTeam((prev: any) => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      alert(err.message || "Failed to update team logo.");
    }
  };

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col pb-20">
      
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

          <div className="flex items-center gap-2">
            {team.batch && (
              <Link
                to={`/batches/${team.batch.slug || `batch-${team.batch.id}`}`}
                className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3] hover:bg-[#FAF7F2] transition-colors"
              >
                🏛️ {team.batch.name} ({team.batch.session})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Hero */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] shadow-sm overflow-hidden relative">
          
          {/* Top Banner Cover Photo */}
          <div className="relative h-44 sm:h-56 w-full bg-[#FAF0E6] overflow-hidden group">
            {team.bannerUrl ? (
              <img
                src={team.bannerUrl}
                alt={`${team.name} Squad Photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#9E2A2B] via-[#842021] to-[#2C221E] flex items-center justify-center text-white/40">
                <span className="text-xs font-bold uppercase tracking-wider">{team.name} Squad Showcase</span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            
            {canEdit && (
              <button
                onClick={() => setShowBannerModal(true)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/20 shadow-md flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-[#F59F00]" />
                <span>Update Squad Banner</span>
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                
                <div className="relative group/logo shrink-0">
                  <SmartAvatar
                    src={team.logoUrl}
                    alt={team.name}
                    fallbackText={team.shortName || team.name}
                    size="2xl"
                    shape="rounded"
                    className="ring-4 ring-white shadow-xl"
                  />
                  {canEdit && (
                    <button
                      onClick={() => setShowLogoModal(true)}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/logo:opacity-100 transition-opacity"
                      title="Update Team Crest"
                    >
                      <Upload className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] font-black uppercase">Logo</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1 pb-1">
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
                <div className="p-4 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center gap-3 self-center sm:self-end">
                  <span className="text-xl">👑</span>
                  <div>
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Team Captain</p>
                    <p className="font-extrabold text-sm text-[#842021]">{team.captain.name}</p>
                    <Link
                      to={`/players/${team.captain.studentId}`}
                      className="text-[10px] text-[#9E2A2B] hover:underline font-bold"
                    >
                      Roll: {team.captain.studentId} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
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

        {/* TEAM PHOTO ALBUM & MOMENTS */}
        {team.id && (
          <MediaGalleryView
            teamId={team.id}
            title={`${team.name} Photo Album & Moments`}
            description="Team squad photos, match action highlights, and victory celebrations."
            allowUpload={true}
          />
        )}

      </main>

      {/* BANNER UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onSuccess={handleUpdateBanner}
        title={`Update ${team.name} Squad Banner`}
        description="Upload a high-resolution team squad photo or lineup banner."
        aspectRatio="banner"
        currentUrl={team.bannerUrl}
      />

      {/* LOGO UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSuccess={handleUpdateLogo}
        title={`Update ${team.name} Logo / Crest`}
        description="Upload an official team emblem or crest."
        aspectRatio="square"
        currentUrl={team.logoUrl}
      />

    </div>
  );
};
