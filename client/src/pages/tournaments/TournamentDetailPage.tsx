import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Layers, 
  BarChart3, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  Settings, 
  Sparkles, 
  GitFork, 
  Flame, 
  Activity, 
  Camera, 
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { OrganizerWorkspaceModal } from "@/components/tournaments/OrganizerWorkspaceModal";
import { TournamentBracketView } from "@/components/tournaments/TournamentBracketView";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { ImageUploadModal } from "@/components/common/ImageUploadModal";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";
import { PlayerChip } from "@/components/common/PlayerChip";
import { BatchChip } from "@/components/common/BatchChip";

export const TournamentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [standingsData, setStandingsData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // UI Tabs & Expansion
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "fixtures" | "standings" | "bracket" | "stats" | "gallery">("overview");
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const fetchTournamentData = async (isInitial = false) => {
    if (!slug) return;
    try {
      if (isInitial) {
        setLoading(true);
      }
      const [tournData, standingsRes, statsRes] = await Promise.all([
        api.tournaments.getDetail(slug),
        api.tournaments.getStandings(slug).catch(() => null),
        api.scoring.getTournamentStats(slug).catch(() => null),
      ]);
      setTournament(tournData);
      setStandingsData(standingsRes);
      setStatsData(statsRes);
    } catch (err: any) {
      console.error("Failed to load tournament", err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    setCurrentUser(user);
    fetchTournamentData(true);
  }, [slug]);

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-[#6B5E53]">
          <Loader2 className="w-5 h-5 animate-spin text-[#9E2A2B]" />
          <span>Loading tournament arena...</span>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center border border-[#E8D6C3]">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#2C221E]">Tournament Not Found</h2>
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  // Check if current logged in user has organizing rights
  const isOrganizer = currentUser && (
    currentUser.role === "ADMIN" || 
    tournament.organizers?.some((o: any) => o.user?.id === currentUser.id || o.userId === currentUser.id)
  );

  const rules = tournament.rules || {};
  const finalMatch = tournament.matches?.find((m: any) => m.stage === "FINAL");

  const handleUpdateBanner = async (url: string) => {
    try {
      await api.tournaments.update(tournament.id, { bannerUrl: url });
      setTournament((prev: any) => ({ ...prev, bannerUrl: url }));
    } catch (err: any) {
      alert(err.message || "Failed to update tournament banner.");
    }
  };

  const handleUpdateLogo = async (url: string) => {
    try {
      await api.tournaments.update(tournament.id, { logoUrl: url });
      setTournament((prev: any) => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      alert(err.message || "Failed to update tournament logo.");
    }
  };
  const isFinalCompleted = finalMatch && finalMatch.status === "COMPLETED";
  const championTeam = isFinalCompleted ? (finalMatch.winnerTeam || tournament.teams?.find((t: any) => t.id === finalMatch.winnerTeamId)) : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-[#E5DACB] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CSEPL Home</span>
          </Link>

          {isOrganizer && (
            <Button
              onClick={() => setShowWorkspaceModal(true)}
              className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-md shadow-[#9E2A2B]/20 flex items-center gap-1.5 animate-pulse"
            >
              <Settings className="w-4 h-4" />
              <span>⚙️ Organize Tournament</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Tournament Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* CHAMPION TROPHY & VICTOR SHOWCASE BANNER */}
        {championTeam && (
          <div className="bg-linear-to-r from-[#FFF9DB] via-[#FFF3BF] to-[#FFE066] border-2 border-[#F59F00] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#F59F00]/15 relative overflow-hidden animate-in fade-in zoom-in-95">
            <div className="absolute -right-8 -bottom-8 text-9xl opacity-15 select-none pointer-events-none">
              🏆
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-[#FFD43B] to-[#F59F00] text-white flex items-center justify-center text-4xl shadow-lg shadow-[#F59F00]/30 border-2 border-white shrink-0 animate-bounce duration-1000">
                  🏆
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E67700] text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                    <span>👑</span>
                    <span>Crowned Tournament Champions</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#3E2900] tracking-tight">
                    {championTeam.name}
                  </h2>
                  <p className="text-xs font-bold text-[#7E4D00]">
                    {championTeam.batch ? `🏛️ ${championTeam.batch.name} (${championTeam.batch.session})` : "CU CSE Squad"}
                    {finalMatch?.resultSummary && ` · ${finalMatch.resultSummary}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <span className="text-[11px] font-black text-[#7E4D00] uppercase tracking-wider">
                  Season {tournament.season} Champions
                </span>
                <div className="flex items-center gap-2">
                  {finalMatch?.playerOfTheMatch && (
                    <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#F59F00]/40 text-xs font-bold text-[#7E4D00] flex items-center gap-1.5">
                      <span>⭐ MVP:</span>
                      <span className="font-extrabold text-[#3E2900]">{finalMatch.playerOfTheMatch.name}</span>
                    </div>
                  )}
                  <Link
                    to={`/matches/${finalMatch.id}`}
                    className="px-4 py-1.5 rounded-xl bg-[#E67700] hover:bg-[#D9480F] text-white font-extrabold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <span>Match Report</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HERO BANNER CARD */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] shadow-sm overflow-hidden relative">
          
          {/* Top Banner Image */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full bg-[#FAF0E6] overflow-hidden group">
            {tournament.bannerUrl ? (
              <img
                src={tournament.bannerUrl}
                alt={tournament.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#9E2A2B] via-[#842021] to-[#2C221E] flex flex-col items-center justify-center text-white/40 p-4 text-center">
                <Trophy className="w-14 h-14 mb-2 text-white/30" />
                <span className="text-xs font-black uppercase tracking-wider text-white/70">
                  CU CSE Department · {tournament.name} ({tournament.season})
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            
            {isOrganizer && (
              <button
                onClick={() => setShowBannerModal(true)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-black px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/20 shadow-md flex items-center gap-1.5 transition-all z-10"
              >
                <Camera className="w-3.5 h-3.5 text-[#F59F00]" />
                <span>{tournament.bannerUrl ? "Update Banner" : "📸 Upload Tournament Banner"}</span>
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="relative group/logo">
                  <SmartAvatar
                    src={tournament.logoUrl}
                    alt={tournament.name}
                    fallbackText={tournament.name}
                    size="2xl"
                    shape="rounded"
                    className="shadow-md ring-2 ring-[#9E2A2B]/20"
                  />
                  {isOrganizer && (
                    <button
                      onClick={() => setShowLogoModal(true)}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover/logo:opacity-100 transition-opacity"
                      title="Update Tournament Logo"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                      {tournament.name}
                    </h1>
                    <span className="text-xs font-black uppercase bg-[#FAF0E6] text-[#842021] px-2.5 py-1 rounded-lg border border-[#E8D6C3]">
                      Season {tournament.season}
                    </span>
                    <span className="text-xs font-extrabold bg-[#2A7B54]/10 text-[#2A7B54] px-2.5 py-1 rounded-lg border border-[#2A7B54]/20">
                      {tournament.status}
                    </span>
                  </div>

                  {/* Rules Badge Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {tournament.sport === "CRICKET" ? (
                      <>
                        <span className="text-xs font-bold bg-[#FAF7F2] text-[#842021] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          🏏 {rules.overs || 10} Overs / Side
                        </span>
                        <span className="text-xs font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          🎯 Max {rules.maxPerBowler || 2} ov/bowler
                        </span>
                        <span className="text-xs font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          ⚡ {rules.powerplay || 2} Ov Powerplay
                        </span>
                        <span className="text-xs font-bold bg-[#FAF0E6] text-[#9E2A2B] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          🏆 Win: {rules.pointsWin || 2} pts · Tie: {rules.pointsTie || 1} pt
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold bg-[#FAF7F2] text-[#842021] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          ⚽ {rules.halfMinutes || 20} Mins / Half
                        </span>
                        <span className="text-xs font-bold bg-[#FAF7F2] text-[#6B5E53] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          👥 {rules.format || "7-a-side"}
                        </span>
                        <span className="text-xs font-bold bg-[#FAF0E6] text-[#9E2A2B] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          🏆 Win: {rules.pointsWin || 3} pts · Draw: {rules.pointsDraw || 1} pt
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats & Organizer count */}
              <div className="flex sm:flex-col gap-3 self-start sm:self-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EFE8DC]">
                <div>
                  <p className="text-2xl font-black text-[#9E2A2B]">{tournament.teams?.length || 0}</p>
                  <p className="text-[11px] font-bold text-[#7C6E63] uppercase">Teams Registered</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#2C221E]">{tournament.matches?.length || 0}</p>
                  <p className="text-[11px] font-bold text-[#7C6E63] uppercase">Matches Scheduled</p>
                </div>
              </div>
            </div>

            {/* Organizers Ribbon */}
            <div className="pt-4 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-[#4A3E35] shrink-0">
                  <Shield className="w-4 h-4 text-[#9E2A2B]" />
                  <span>Organizing Committee:</span>
                </div>
                {tournament.organizers && tournament.organizers.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tournament.organizers.map((o: any) => (
                      <PlayerChip
                        key={o.user.id}
                        name={o.user.name}
                        studentId={o.user.studentId}
                        avatarUrl={o.user.avatarUrl}
                        size="xs"
                        variant="badge"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[#7C6E63]">Department Appointees</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isOrganizer && (
                  <button
                    onClick={() => setShowBannerModal(true)}
                    className="text-xs font-bold text-[#9E2A2B] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Cover</span>
                  </button>
                )}
                {isOrganizer && (
                  <span className="text-[11px] font-extrabold text-[#9E2A2B] bg-[#FAF0E6] px-3 py-1 rounded-xl border border-[#E8D6C3]">
                    Organizer Mode ⚡
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PUBLIC TABS BAR */}
        <div className="flex items-center gap-2 border-b border-[#E5DACB] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "overview"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "teams"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams & Squads ({tournament.teams?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("fixtures")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "fixtures"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Fixtures & Schedule ({tournament.matches?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("standings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "standings"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Points Table</span>
          </button>

          <button
            onClick={() => setActiveTab("bracket")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "bracket"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>🏆 Knockout Bracket</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === "stats"
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>📊 Leaderboards & Stats</span>
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
            <span>📸 Gallery & Highlights</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
                <h3 className="text-base font-black text-[#2C221E] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#9E2A2B]" />
                  <span>Tournament Rulebook & Specifications</span>
                </h3>
                <p className="text-xs text-[#6B5E53] leading-relaxed">
                  Official tournament regulations for {tournament.name}, Department of Computer Science & Engineering, University of Chittagong.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Tournament Format</p>
                    <p className="font-extrabold text-[#2C221E] mt-0.5">
                      {tournament.sport === "CRICKET" ? `${rules.overs || 10} Overs Tape-Ball Cricket` : `${rules.format || "7-a-side"} Futsal`}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Points System</p>
                    <p className="font-extrabold text-[#9E2A2B] mt-0.5">
                      Win: {rules.pointsWin || (tournament.sport === "FOOTBALL" ? 3 : 2)} Pts · Tie/Draw: {rules.pointsTie || 1} Pt
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Venue & Pitch</p>
                    <p className="font-extrabold text-[#2C221E] mt-0.5">
                      {tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field"}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                    <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Match Timing</p>
                    <p className="font-extrabold text-[#2C221E] mt-0.5">Morning & Afternoon Sessions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Organizers */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[#2C221E] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#9E2A2B]" />
                  <span>Organizing Committee</span>
                </h3>

                <div className="space-y-2.5">
                  {tournament.organizers?.map((org: any) => (
                    <div key={org.id} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-[#2C221E]">{org.user.name}</p>
                        <p className="text-[10px] text-[#7C6E63] font-mono">Roll: {org.user.studentId}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#842021] bg-[#FAF0E6] px-2 py-0.5 rounded border border-[#E8D6C3]">
                        Organizer
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAMS & SQUADS */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournament.teams?.map((team: any) => (
                <div key={team.id} className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center font-black text-base shadow-sm">
                        {team.shortName || team.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-[#2C221E]">{team.name}</h3>
                          {team.group && (
                            <span className="text-[10px] font-black uppercase bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded-full border border-[#E8D6C3]">
                              {team.group.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {team.batch ? (
                            <BatchChip
                              name={team.batch.name}
                              session={team.batch.session}
                              slug={team.batch.slug}
                              avatarUrl={team.batch.avatarUrl}
                              batchNumber={team.batch.batchNumber}
                              size="xs"
                              variant="pill"
                            />
                          ) : (
                            <span className="text-xs text-[#7C6E63]">Independent Squad</span>
                          )}
                          <span className="text-xs text-[#7C6E63]">· {team.members?.length || 0} Players</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/teams/${team.id}`}
                      className="text-xs font-bold text-[#9E2A2B] hover:underline shrink-0"
                    >
                      Team Page →
                    </Link>
                  </div>

                  {/* Captain Banner */}
                  {team.captain && (
                    <div className="p-3 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <PlayerChip
                          name={team.captain.name}
                          studentId={team.captain.studentId}
                          avatarUrl={team.captain.avatarUrl}
                          isCaptain={true}
                          size="sm"
                          variant="inline"
                        />
                      </div>
                      <Link
                        to={`/players/${team.captain.studentId}`}
                        className="text-[10px] font-bold text-[#9E2A2B] bg-white px-2 py-1 rounded-lg border border-[#E8D6C3]"
                      >
                        Profile
                      </Link>
                    </div>
                  )}

                  {/* Expand Squad Trigger */}
                  <div>
                    <button
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-[#6B5E53] hover:text-[#9E2A2B] p-2 rounded-xl hover:bg-[#FAF7F2]"
                    >
                      <span>Squad Roster ({team.members?.length || 0} registered)</span>
                      {expandedTeamId === team.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedTeamId === team.id && (
                      <div className="mt-3 pt-3 border-t border-[#EFE8DC] space-y-1.5 animate-in fade-in">
                        {team.members?.map((m: any) => (
                          <div
                            key={m.userId}
                            className="p-2.5 bg-[#FAF7F2] hover:bg-[#FAF0E6] rounded-xl border border-[#E8DCCF] flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] font-bold text-[#9E2A2B] bg-white px-1.5 py-0.5 rounded border border-[#E8D6C3]">
                                #{m.jerseyNumber || m.user.preferredJerseyNo || "—"}
                              </span>
                              <PlayerChip
                                name={m.user.name}
                                studentId={m.user.studentId}
                                avatarUrl={m.user.avatarUrl}
                                isCaptain={m.isCaptain}
                                size="xs"
                              />
                            </div>

                            <span className="text-[11px] text-[#7C6E63]">
                              {tournament.sport === "CRICKET" ? (m.user.cricketRole || "Player") : (m.user.footballPosition || "Player")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FIXTURES & SCHEDULE */}
        {activeTab === "fixtures" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.matches?.map((m: any) => (
                <div key={m.id} className="bg-white rounded-3xl border border-[#E5DACB] p-5 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#7C6E63] pb-2 border-b border-[#EFE8DC]">
                    <span className="font-black text-[#9E2A2B]">Match #{m.matchNumber}</span>
                    <span className="font-bold bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded">
                      {m.stage?.replace("_", " ")} {m.group ? `· ${m.group.name}` : ""}
                    </span>
                    <span className={`font-bold ${m.status === "LIVE" ? "text-[#C92A2A] animate-pulse" : m.status === "COMPLETED" ? "text-[#2A7B54]" : "text-[#7C6E63]"}`}>
                      {m.status}
                    </span>
                  </div>

                  {/* Team A vs Team B Display */}
                  <div className="grid grid-cols-5 items-center gap-3 py-2">
                    <div className="col-span-2 flex items-center gap-2.5 text-left min-w-0">
                      <SmartAvatar
                        src={m.teamA.logoUrl}
                        alt={m.teamA.name}
                        fallbackText={m.teamA.shortName || m.teamA.name}
                        size="sm"
                        shape="rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-[#2C221E] truncate">{m.teamA.name}</p>
                        {m.teamA.batch ? (
                          <div className="mt-0.5">
                            <BatchChip
                              name={m.teamA.batch.name}
                              session={m.teamA.batch.session}
                              slug={m.teamA.batch.slug}
                              avatarUrl={m.teamA.batch.avatarUrl}
                              batchNumber={m.teamA.batch.batchNumber}
                              size="xs"
                              variant="inline"
                              className="text-[10px] text-[#7C6E63]"
                            />
                          </div>
                        ) : (
                          <p className="font-mono text-[10px] text-[#7C6E63]">{m.teamA.shortName}</p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xs font-black text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-1 rounded-full border border-[#E8D6C3]">
                        VS
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2.5 text-right min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-[#2C221E] truncate">{m.teamB.name}</p>
                        {m.teamB.batch ? (
                          <div className="mt-0.5 flex justify-end">
                            <BatchChip
                              name={m.teamB.batch.name}
                              session={m.teamB.batch.session}
                              slug={m.teamB.batch.slug}
                              avatarUrl={m.teamB.batch.avatarUrl}
                              batchNumber={m.teamB.batch.batchNumber}
                              size="xs"
                              variant="inline"
                              className="text-[10px] text-[#7C6E63]"
                            />
                          </div>
                        ) : (
                          <p className="font-mono text-[10px] text-[#7C6E63]">{m.teamB.shortName}</p>
                        )}
                      </div>
                      <SmartAvatar
                        src={m.teamB.logoUrl}
                        alt={m.teamB.name}
                        fallbackText={m.teamB.shortName || m.teamB.name}
                        size="sm"
                        shape="rounded"
                      />
                    </div>
                  </div>

                  {/* Match Info Footer */}
                  <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-[11px] text-[#7C6E63]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      <span>{m.venue || "CU CSE Ground"}</span>
                    </span>

                    <div className="flex items-center gap-1.5 font-semibold text-[#4A3E35]">
                      <span className="text-[10px] text-[#7C6E63]">Scorer:</span>
                      {m.scorers?.length > 0 ? (
                        <PlayerChip
                          name={m.scorers[0].user.name}
                          studentId={m.scorers[0].user.studentId}
                          avatarUrl={m.scorers[0].user.avatarUrl}
                          size="xs"
                        />
                      ) : (
                        <span className="text-[#7C6E63] font-medium">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Match Center & Scorer Links */}
                  <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between gap-2">
                    <Link
                      to={`/matches/${m.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#2C221E] font-bold text-[11px] border border-[#E8DCCF] flex items-center gap-1.5 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      <span>{m.status === "LIVE" ? "🔴 Live Match Arena" : "Match Center"}</span>
                    </Link>

                    {isOrganizer && (
                      <Link
                        to={`/matches/${m.id}/score`}
                        className="px-3 py-1.5 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <span>⚙️ Score Match</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {(!tournament.matches || tournament.matches.length === 0) && (
                <div className="col-span-2 p-12 bg-white rounded-3xl border border-[#E5DACB] text-center space-y-3">
                  <Calendar className="w-10 h-10 text-[#9E2A2B] mx-auto opacity-50" />
                  <h4 className="text-sm font-black text-[#2C221E]">No Matches Scheduled Yet</h4>
                  <p className="text-xs text-[#7C6E63] max-w-sm mx-auto">
                    Organizers will generate round-robin fixtures and schedule the group stage shortly.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STANDINGS / POINTS TABLE */}
        {activeTab === "standings" && (
          <div className="space-y-6">
            {standingsData?.groups?.map((grp: any) => (
              <div key={grp.groupId} className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                  <h3 className="text-base font-black text-[#9E2A2B] flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    <span>{grp.groupName} Standings</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#EFE8DC] text-[#7C6E63] uppercase text-[10px] font-extrabold tracking-wider">
                        <th className="py-2.5 px-3">Pos</th>
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-2 text-center">P</th>
                        <th className="py-2.5 px-2 text-center">W</th>
                        <th className="py-2.5 px-2 text-center">L</th>
                        <th className="py-2.5 px-2 text-center">T/D</th>
                        {tournament.sport === "CRICKET" ? (
                          <th className="py-2.5 px-3 text-right">NRR</th>
                        ) : (
                          <>
                            <th className="py-2.5 px-2 text-center">GF</th>
                            <th className="py-2.5 px-2 text-center">GA</th>
                            <th className="py-2.5 px-3 text-right">GD</th>
                          </>
                        )}
                        <th className="py-2.5 px-3 text-right font-black text-[#9E2A2B]">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FAF0E6]">
                      {grp.standings?.map((row: any, idx: number) => (
                        <tr key={row.teamId} className="hover:bg-[#FAF7F2]">
                          <td className="py-3 px-3 font-bold text-[#7C6E63]">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <SmartAvatar
                                src={row.teamLogoUrl}
                                alt={row.teamName}
                                fallbackText={row.shortName || row.teamName}
                                size="sm"
                                shape="rounded"
                              />
                              <div>
                                <p className="font-extrabold text-[#2C221E]">{row.teamName}</p>
                                {row.batch ? (
                                  <div className="mt-0.5">
                                    <BatchChip
                                      name={row.batch.name}
                                      session={row.batch.session}
                                      slug={row.batch.slug}
                                      avatarUrl={row.batch.avatarUrl}
                                      batchNumber={row.batch.batchNumber}
                                      size="xs"
                                      variant="inline"
                                      className="text-[10px] text-[#7C6E63]"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-[#7C6E63] font-mono">{row.batchName || row.shortName}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-bold">{row.played}</td>
                          <td className="py-3 px-2 text-center font-bold text-[#2A7B54]">{row.won}</td>
                          <td className="py-3 px-2 text-center font-bold text-[#C92A2A]">{row.lost}</td>
                          <td className="py-3 px-2 text-center font-bold text-[#7C6E63]">{row.tied}</td>
                          {tournament.sport === "CRICKET" ? (
                            <td className="py-3 px-3 text-right font-mono font-bold">
                              {row.nrr > 0 ? `+${row.nrr}` : row.nrr}
                            </td>
                          ) : (
                            <>
                              <td className="py-3 px-2 text-center font-mono">{row.goalsFor}</td>
                              <td className="py-3 px-2 text-center font-mono">{row.goalsAgainst}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                              </td>
                            </>
                          )}
                          <td className="py-3 px-3 text-right font-black text-sm text-[#9E2A2B] bg-[#FAF0E6]/50">
                            {row.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: KNOCKOUT BRACKET */}
        {activeTab === "bracket" && (
          <TournamentBracketView
            tournament={tournament}
            isOrganizer={isOrganizer}
            onRefresh={() => fetchTournamentData()}
            onEditMatch={() => setShowWorkspaceModal(true)}
          />
        )}

        {/* TAB 6: LEADERBOARDS & STATS */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {tournament.sport === "CRICKET" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Orange Cap: Top Run Scorers */}
                <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟠</span>
                      <h3 className="font-black text-sm text-[#2C221E]">Orange Cap: Top Run Scorers</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#EFE8DC] text-[#7C6E63] uppercase text-[10px] font-extrabold">
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-3">Player</th>
                          <th className="py-2 px-2 text-right font-black text-[#9E2A2B]">Runs</th>
                          <th className="py-2 px-2 text-right">Inn</th>
                          <th className="py-2 px-2 text-right">Avg</th>
                          <th className="py-2 px-2 text-right">SR</th>
                          <th className="py-2 px-2 text-right">6s</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#FAF0E6]">
                        {statsData?.orangeCap?.map((row: any, idx: number) => (
                          <tr key={row.player.id} className="hover:bg-[#FAF7F2]">
                            <td className="py-2.5 px-2 font-bold text-[#7C6E63]">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <PlayerChip
                                name={row.player.name}
                                studentId={row.player.studentId}
                                avatarUrl={row.player.avatarUrl}
                                size="xs"
                              />
                              {row.player.batch && (
                                <div className="mt-0.5">
                                  <BatchChip
                                    name={row.player.batch.name}
                                    session={row.player.batch.session}
                                    slug={row.player.batch.slug}
                                    avatarUrl={row.player.batch.avatarUrl}
                                    batchNumber={row.player.batch.batchNumber}
                                    size="xs"
                                    variant="inline"
                                    className="text-[10px] text-[#7C6E63]"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-black text-[#9E2A2B] bg-[#FAF0E6]/50">{row.runs}</td>
                            <td className="py-2.5 px-2 text-right font-bold">{row.innings}</td>
                            <td className="py-2.5 px-2 text-right font-mono">{row.average}</td>
                            <td className="py-2.5 px-2 text-right font-mono">{row.strikeRate}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-[#2A7B54]">{row.sixes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!statsData?.orangeCap || statsData.orangeCap.length === 0) && (
                      <p className="text-xs text-[#A89A8D] italic text-center py-6">No batting records logged yet.</p>
                    )}
                  </div>
                </div>

                {/* Purple Cap: Top Wicket Takers */}
                <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟣</span>
                      <h3 className="font-black text-sm text-[#2C221E]">Purple Cap: Top Wicket Takers</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#EFE8DC] text-[#7C6E63] uppercase text-[10px] font-extrabold">
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-3">Bowler</th>
                          <th className="py-2 px-2 text-right font-black text-[#9E2A2B]">Wkts</th>
                          <th className="py-2 px-2 text-right">Overs</th>
                          <th className="py-2 px-2 text-right">Runs</th>
                          <th className="py-2 px-2 text-right">Econ</th>
                          <th className="py-2 px-2 text-right">BBI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#FAF0E6]">
                        {statsData?.purpleCap?.map((row: any, idx: number) => (
                          <tr key={row.player.id} className="hover:bg-[#FAF7F2]">
                            <td className="py-2.5 px-2 font-bold text-[#7C6E63]">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <PlayerChip
                                name={row.player.name}
                                studentId={row.player.studentId}
                                avatarUrl={row.player.avatarUrl}
                                size="xs"
                              />
                              {row.player.batch && (
                                <div className="mt-0.5">
                                  <BatchChip
                                    name={row.player.batch.name}
                                    session={row.player.batch.session}
                                    slug={row.player.batch.slug}
                                    avatarUrl={row.player.batch.avatarUrl}
                                    batchNumber={row.player.batch.batchNumber}
                                    size="xs"
                                    variant="inline"
                                    className="text-[10px] text-[#7C6E63]"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-black text-[#9E2A2B] bg-[#FAF0E6]/50">{row.wickets}</td>
                            <td className="py-2.5 px-2 text-right font-bold">{row.overs}</td>
                            <td className="py-2.5 px-2 text-right font-mono">{row.runs}</td>
                            <td className="py-2.5 px-2 text-right font-mono">{row.economy}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-[#2A7B54]">{row.bestFigures}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!statsData?.purpleCap || statsData.purpleCap.length === 0) && (
                      <p className="text-xs text-[#A89A8D] italic text-center py-6">No bowling records logged yet.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Football Leaderboards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Golden Boot */}
                <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                  <h3 className="font-black text-sm text-[#2C221E] flex items-center gap-2">
                    <span>⚽</span>
                    <span>Golden Boot: Top Goal Scorers</span>
                  </h3>
                  <div className="space-y-2">
                    {statsData?.goldenBoot?.map((row: any, idx: number) => (
                      <div key={row.player.id} className="p-3 bg-[#FAF7F2] rounded-2xl flex items-center justify-between text-xs border border-[#E8DCCF]">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#7C6E63] w-5">#{idx + 1}</span>
                          <div>
                            <PlayerChip
                              name={row.player.name}
                              studentId={row.player.studentId}
                              avatarUrl={row.player.avatarUrl}
                              size="xs"
                            />
                            {row.player.batch && (
                              <div className="mt-0.5">
                                <BatchChip
                                  name={row.player.batch.name}
                                  session={row.player.batch.session}
                                  slug={row.player.batch.slug}
                                  avatarUrl={row.player.batch.avatarUrl}
                                  batchNumber={row.player.batch.batchNumber}
                                  size="xs"
                                  variant="inline"
                                  className="text-[10px] text-[#7C6E63]"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-sm font-black text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-1 rounded-xl border border-[#E8D6C3]">
                          {row.goals} Goals
                        </span>
                      </div>
                    ))}
                    {(!statsData?.goldenBoot || statsData.goldenBoot.length === 0) && (
                      <p className="text-xs text-[#A89A8D] italic text-center py-6">No goals logged yet.</p>
                    )}
                  </div>
                </div>

                {/* Top Playmakers */}
                <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4">
                  <h3 className="font-black text-sm text-[#2C221E] flex items-center gap-2">
                    <span>🎯</span>
                    <span>Top Playmakers: Most Assists</span>
                  </h3>
                  <div className="space-y-2">
                    {statsData?.topPlaymakers?.map((row: any, idx: number) => (
                      <div key={row.player.id} className="p-3 bg-[#FAF7F2] rounded-2xl flex items-center justify-between text-xs border border-[#E8DCCF]">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#7C6E63] w-5">#{idx + 1}</span>
                          <div>
                            <PlayerChip
                              name={row.player.name}
                              studentId={row.player.studentId}
                              avatarUrl={row.player.avatarUrl}
                              size="xs"
                            />
                            {row.player.batch && (
                              <div className="mt-0.5">
                                <BatchChip
                                  name={row.player.batch.name}
                                  session={row.player.batch.session}
                                  slug={row.player.batch.slug}
                                  avatarUrl={row.player.batch.avatarUrl}
                                  batchNumber={row.player.batch.batchNumber}
                                  size="xs"
                                  variant="inline"
                                  className="text-[10px] text-[#7C6E63]"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-sm font-black text-[#2A7B54] bg-[#E6FCF5] px-2.5 py-1 rounded-xl border border-[#20C997]/30">
                          {row.assists} Assists
                        </span>
                      </div>
                    ))}
                    {(!statsData?.topPlaymakers || statsData.topPlaymakers.length === 0) && (
                      <p className="text-xs text-[#A89A8D] italic text-center py-6">No assists logged yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: GALLERY & HIGHLIGHTS */}
        {activeTab === "gallery" && (
          <MediaGalleryView
            tournamentId={tournament.id}
            title={`${tournament.name} Gallery & Action`}
            description="Trophy presentations, match action photos, squad portraits, and celebrations."
            allowUpload={true}
          />
        )}

      </main>

      {/* In-Context Organizer Workspace Modal */}
      <OrganizerWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        tournament={tournament}
        onRefresh={() => {
          fetchTournamentData();
        }}
      />

      {/* BANNER UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onSuccess={handleUpdateBanner}
        title={`Update ${tournament.name} Banner`}
        description="Upload a high-resolution tournament stage or field banner."
        aspectRatio="banner"
        currentUrl={tournament.bannerUrl}
      />

      {/* LOGO UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSuccess={handleUpdateLogo}
        title={`Update ${tournament.name} Logo`}
        description="Upload the official tournament emblem or crest."
        aspectRatio="square"
        currentUrl={tournament.logoUrl}
      />

    </div>
  );
};
