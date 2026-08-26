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
  UserCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { OrganizerWorkspaceModal } from "@/components/tournaments/OrganizerWorkspaceModal";

export const TournamentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [standingsData, setStandingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // UI Tabs & Expansion
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "fixtures" | "standings">("overview");
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const fetchTournamentData = async (isInitial = false) => {
    if (!slug) return;
    try {
      if (isInitial) {
        setLoading(true);
      }
      const [tournData, standingsRes] = await Promise.all([
        api.tournaments.getDetail(slug),
        api.tournaments.getStandings(slug).catch(() => null),
      ]);
      setTournament(tournData);
      setStandingsData(standingsRes);
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
        
        {/* HERO BANNER CARD */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl brick-gradient text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#9E2A2B]/20 border-2 border-[#842021] shrink-0">
                {tournament.sport === "CRICKET" ? "🏏" : "⚽"}
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
          <div className="mt-6 pt-5 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#9E2A2B]" />
              <span className="font-bold text-[#4A3E35]">Organizing Committee:</span>
              <span className="text-[#6B5E53]">
                {tournament.organizers?.map((o: any) => `${o.user.name} (${o.user.studentId})`).join(", ") || "Department Appointees"}
              </span>
            </div>

            {isOrganizer && (
              <span className="text-[11px] font-extrabold text-[#9E2A2B] bg-[#FAF0E6] px-3 py-1 rounded-xl border border-[#E8D6C3]">
                You have Organizer Permissions ⚡
              </span>
            )}
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
            <span>Points Table & Standings</span>
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
                        <p className="text-xs text-[#7C6E63]">
                          {team.batch ? `🏛️ ${team.batch.name} (${team.batch.session})` : "Independent Squad"} · {team.members?.length || 0} Players
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/teams/${team.id}`}
                      className="text-xs font-bold text-[#9E2A2B] hover:underline"
                    >
                      Team Page →
                    </Link>
                  </div>

                  {/* Captain Banner */}
                  {team.captain && (
                    <div className="p-3 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👑</span>
                        <div>
                          <p className="font-extrabold text-[#842021]">{team.captain.name}</p>
                          <p className="text-[10px] text-[#7C6E63] font-mono">Captain · Roll: {team.captain.studentId}</p>
                        </div>
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
                          <Link
                            key={m.userId}
                            to={`/players/${m.user.studentId}`}
                            className="p-2.5 bg-[#FAF7F2] hover:bg-[#FAF0E6] rounded-xl border border-[#E8DCCF] flex items-center justify-between text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] font-bold text-[#9E2A2B] bg-white px-1.5 py-0.5 rounded border border-[#E8D6C3]">
                                #{m.jerseyNumber || m.user.preferredJerseyNo || "—"}
                              </span>
                              <span className="font-bold text-[#2C221E] group-hover:text-[#9E2A2B]">
                                {m.user.name}
                              </span>
                              {m.isCaptain && <span className="text-[10px]">👑</span>}
                            </div>

                            <span className="text-[11px] text-[#7C6E63]">
                              {tournament.sport === "CRICKET" ? (m.user.cricketRole || "Player") : (m.user.footballPosition || "Player")}
                            </span>
                          </Link>
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
                    <span className="font-bold text-[#2A7B54]">{m.status}</span>
                  </div>

                  {/* Team A vs Team B Display */}
                  <div className="grid grid-cols-5 items-center gap-2 py-2">
                    <div className="col-span-2 text-left">
                      <p className="font-black text-sm text-[#2C221E]">{m.teamA.name}</p>
                      <p className="font-mono text-[10px] text-[#7C6E63]">{m.teamA.shortName}</p>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xs font-black text-[#9E2A2B] bg-[#FAF0E6] px-2.5 py-1 rounded-full border border-[#E8D6C3]">
                        VS
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="font-black text-sm text-[#2C221E]">{m.teamB.name}</p>
                      <p className="font-mono text-[10px] text-[#7C6E63]">{m.teamB.shortName}</p>
                    </div>
                  </div>

                  {/* Match Info Footer */}
                  <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-[11px] text-[#7C6E63]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      <span>{m.venue || "CU CSE Ground"}</span>
                    </span>

                    <span className="flex items-center gap-1 font-semibold text-[#4A3E35]">
                      <UserCheck className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      <span>Scorer: {m.scorers?.length > 0 ? m.scorers[0].user.name : "Unassigned"}</span>
                    </span>
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
                            <p className="font-extrabold text-[#2C221E]">{row.teamName}</p>
                            <p className="text-[10px] text-[#7C6E63] font-mono">{row.batchName || row.shortName}</p>
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

    </div>
  );
};
