import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Users, 
  Trophy, 
  Camera, 
  ArrowLeft, 
  GraduationCap, 
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "@/context/ToastContext";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { ImageUploadModal } from "@/components/common/ImageUploadModal";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";

export const BatchDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "teams" | "gallery">("students");
  const [showBannerUploadModal, setShowBannerUploadModal] = useState(false);
  const [showAvatarUploadModal, setShowAvatarUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = api.auth.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const isBatchMember = currentUser?.batchId === batch?.id;
  const canEdit = isAdmin || isBatchMember;

  useEffect(() => {
    fetchBatchDetail();
  }, [slug]);

  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      const data = await api.batches.getBySlug(slug!);
      setBatch(data);
    } catch (err: any) {
      setError(err.message || "Failed to load batch details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBanner = async (url: string) => {
    try {
      await api.batches.update(batch.id, { bannerUrl: url });
      setBatch((prev: any) => ({ ...prev, bannerUrl: url }));
      toast.success("Batch banner updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update banner.");
    }
  };

  const handleUpdateAvatar = async (url: string) => {
    try {
      await api.batches.update(batch.id, { avatarUrl: url });
      setBatch((prev: any) => ({ ...prev, avatarUrl: url }));
      toast.success("Batch crest updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch crest.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-xs font-bold text-[#7C6E63] flex items-center gap-2">
          <span className="animate-spin">🔄</span>
          <span>Loading Batch Showcase...</span>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border-2 border-[#E5DACB] text-center space-y-4 max-w-md">
          <h2 className="text-lg font-black text-[#2C221E]">Batch Not Found</h2>
          <p className="text-xs text-[#7C6E63]">{error || "Could not find requested batch."}</p>
          <Link to="/">
            <Button className="bg-[#9E2A2B] text-white text-xs font-bold rounded-xl">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredStudents = (batch.users || []).filter((st: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name?.toLowerCase().includes(q) ||
      st.studentId?.toLowerCase().includes(q) ||
      st.cricketRole?.toLowerCase().includes(q) ||
      st.footballPosition?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] pb-20">
      
      {/* Top Header Breadcrumb */}
      <header className="bg-white border-b border-[#EFE8DC] sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/batches"
              className="p-2 rounded-xl text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Back to All Batches"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Batches</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                  Batch Showcase
                </span>
                <span className="text-xs font-black text-[#2C221E]">
                  {batch.name} · Session {batch.session}
                </span>
              </div>
              <p className="text-[11px] text-[#7C6E63]">Department of Computer Science & Engineering, CU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBannerUploadModal(true)}
                className="border-[#D8C7B3] text-[#7C6E63] hover:text-[#2C221E] text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>📸 Change Class Photo</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* HERO BATCH COVER & INFO CARD */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] shadow-sm overflow-hidden relative">
          
          {/* Top Banner Cover Photo */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full bg-[#FAF0E6] overflow-hidden group">
            {batch.bannerUrl ? (
              <img
                src={batch.bannerUrl}
                alt={`${batch.name} Class Photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#9E2A2B] via-[#842021] to-[#2C221E] flex flex-col items-center justify-center text-white/40 p-4 text-center">
                <GraduationCap className="w-16 h-16 mb-2 text-white/30" />
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {batch.name} Official Class Photo
                </p>
              </div>
            )}

            {/* Gradient Shade for Title legibility */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

            {/* Change Banner Button Overlay */}
            {canEdit && (
              <button
                onClick={() => setShowBannerUploadModal(true)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-black px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/20 shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
              >
                <Camera className="w-4 h-4 text-[#F59F00]" />
                <span>Update Class Photo</span>
              </button>
            )}

            {/* Batch Avatar & Name overlay at bottom of banner */}
            <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div className="flex items-end gap-4">
                <div className="relative group/avatar">
                  <SmartAvatar
                    src={batch.avatarUrl}
                    alt={batch.name}
                    size="2xl"
                    shape="rounded"
                    className="ring-4 ring-white shadow-xl"
                  />
                  {canEdit && (
                    <button
                      onClick={() => setShowAvatarUploadModal(true)}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                      title="Change Batch Logo"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                      {batch.name}
                    </h1>
                    <span className="text-xs font-black bg-white/20 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full border border-white/30">
                      Session {batch.session}
                    </span>
                  </div>
                  {batch.slogan ? (
                    <p className="text-xs font-medium text-white/90 italic drop-shadow-xs max-w-xl">
                      "{batch.slogan}"
                    </p>
                  ) : (
                    <p className="text-xs text-white/75 font-semibold">
                      Department of Computer Science & Engineering · University of Chittagong
                    </p>
                  )}
                </div>
              </div>

              {/* Batch Counters Pill */}
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold text-white self-start sm:self-end">
                <div>
                  <span className="text-base font-black text-[#F59F00]">{batch.users?.length || 0}</span>
                  <span className="text-[10px] text-white/70 uppercase block">Classmates</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-base font-black text-white">{batch.teams?.length || 0}</span>
                  <span className="text-[10px] text-white/70 uppercase block">Teams</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-base font-black text-[#20C997]">{batch.mediaAssets?.length || 0}</span>
                  <span className="text-[10px] text-white/70 uppercase block">Photos</span>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Info bar */}
          <div className="p-5 bg-white border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-[#7C6E63]">
              <span className="flex items-center gap-1.5 font-bold text-[#2C221E]">
                <GraduationCap className="w-4 h-4 text-[#9E2A2B]" />
                <span>Batch #{batch.batchNumber}</span>
              </span>
              <span>·</span>
              <span className="font-medium">Session: <strong>{batch.session}</strong></span>
              <span>·</span>
              <span className="font-medium">{batch.users?.length || 0} Registered Students</span>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="outline" className="text-xs font-bold h-8 border-[#D8C7B3] rounded-xl">
                  My Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-[#E5DACB] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "students"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Classmates & Roster ({batch.users?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "teams"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Teams & Tournaments ({batch.teams?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "gallery"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Batch Memories & Photo Album</span>
          </button>
        </div>

        {/* TAB 1: STUDENTS & CLASSMATES ROSTER */}
        {activeTab === "students" && (
          <div className="space-y-4">
            
            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border-2 border-[#E5DACB] flex items-center justify-between gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classmates by name, roll, or sports role..."
                className="w-full px-4 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-xs font-medium"
              />
              <span className="text-xs font-bold text-[#7C6E63] shrink-0">
                {filteredStudents.length} Found
              </span>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStudents.map((st: any) => (
                <Link
                  key={st.id}
                  to={`/players/${st.studentId || st.id}`}
                  className="bg-white rounded-3xl border-2 border-[#E8DCCF] p-4 shadow-xs hover:border-[#9E2A2B] hover:shadow-md transition-all flex items-center gap-3.5 group"
                >
                  <SmartAvatar
                    src={st.avatarUrl}
                    alt={st.name}
                    size="lg"
                    shape="rounded"
                    className="group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-[#2C221E] truncate group-hover:text-[#9E2A2B] transition-colors">
                      {st.name}
                    </h4>
                    <p className="font-mono text-[11px] font-bold text-[#9E2A2B]">
                      {st.studentId}
                    </p>
                    <p className="text-[10px] text-[#7C6E63] truncate mt-0.5">
                      {st.cricketRole || st.footballPosition || "Player"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TEAMS & TOURNAMENTS */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            {(!batch.teams || batch.teams.length === 0) ? (
              <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-12 text-center space-y-3">
                <Trophy className="w-12 h-12 text-[#9E2A2B] mx-auto opacity-50" />
                <h3 className="font-black text-sm text-[#2C221E]">No Teams Registered Yet</h3>
                <p className="text-xs text-[#7C6E63] max-w-sm mx-auto">
                  This batch hasn't formed any official teams for CSEPL tournaments yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {batch.teams.map((team: any) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="bg-white rounded-3xl border-2 border-[#E8DCCF] p-5 shadow-xs hover:border-[#9E2A2B] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <SmartAvatar
                        src={team.logoUrl}
                        alt={team.name}
                        fallbackText={team.shortName || team.name}
                        size="lg"
                        shape="rounded"
                      />
                      <div>
                        <h3 className="font-black text-sm text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors">
                          {team.name}
                        </h3>
                        <span className="text-[11px] font-mono font-bold text-[#7C6E63] uppercase">
                          {team.shortName || "CSE"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-[#4A3E35]">
                          {team.tournament?.name || "Tournament"}
                        </p>
                        <span className="text-[10px] font-black uppercase text-[#9E2A2B] bg-[#FAF0E6] px-2 py-0.5 rounded-md">
                          {team.tournament?.sport} · {team.tournament?.season}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#9E2A2B] flex items-center gap-1">
                        <span>Squad View</span>
                        <span>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BATCH MEMORIES & PHOTO GALLERY */}
        {activeTab === "gallery" && (
          <MediaGalleryView
            batchId={batch.id}
            defaultCategory="BATCH_GALLERY"
            title={`${batch.name} Photo Album & Moments`}
            description="Class photos, sports day memories, celebration highlights, and batch reunions."
            allowUpload={true}
          />
        )}

      </main>

      {/* BANNER UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showBannerUploadModal}
        onClose={() => setShowBannerUploadModal(false)}
        onSuccess={handleUpdateBanner}
        title={`Update ${batch.name} Class Photo`}
        description="Upload a high-resolution class group photo, picnic banner, or department moment."
        aspectRatio="banner"
        currentUrl={batch.bannerUrl}
      />

      {/* AVATAR / CREST UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showAvatarUploadModal}
        onClose={() => setShowAvatarUploadModal(false)}
        onSuccess={handleUpdateAvatar}
        title={`Update ${batch.name} Crest / Logo`}
        description="Upload an official batch emblem, crest, or mascot logo."
        aspectRatio="square"
        currentUrl={batch.avatarUrl}
      />

    </div>
  );
};
