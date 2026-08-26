import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Users, 
  Trophy, 
  Layers, 
  Activity, 
  Plus, 
  FileSpreadsheet, 
  Search, 
  Copy, 
  CheckCircle2, 
  LogOut, 
  ArrowLeft, 
  X, 
  UserCheck,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type BatchItem, type UserItem, type TournamentItem } from "@/lib/api";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"batches" | "players" | "tournaments" | "logs">("batches");
  
  // Notice alert state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // 1. Batches State
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSession, setNewBatchSession] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchSlogan, setNewBatchSlogan] = useState("");

  // 2. Players State
  const [players, setPlayers] = useState<UserItem[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerBatchFilter, setPlayerBatchFilter] = useState<string>("ALL");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showBulkCsvModal, setShowBulkCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [newPlayerRoll, setNewPlayerRoll] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [newPlayerBatchId, setNewPlayerBatchId] = useState<number | null>(null);
  const [newPlayerRole, setNewPlayerRole] = useState("🏏 Top-Order Bat");
  const [newPlayerPosition, setNewPlayerPosition] = useState("⚽ Forward");

  // 3. Tournaments State
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);
  const [showAssignOrganizerModal, setShowAssignOrganizerModal] = useState(false);
  const [selectedTournamentForOrg, setSelectedTournamentForOrg] = useState<number | null>(null);
  const [selectedUserForOrg, setSelectedUserForOrg] = useState<number | null>(null);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentSport, setNewTournamentSport] = useState<"CRICKET" | "FOOTBALL">("CRICKET");
  const [newTournamentSeason, setNewTournamentSeason] = useState("2026");
  const [newTournamentRules, setNewTournamentRules] = useState("10 overs per side, 2 overs max per bowler");

  // 4. Audit Logs State
  const [auditLogs, setAuditLogs] = useState<{ id: number; time: string; action: string; user: string }[]>([
    { id: 1, time: "Initial", action: "Admin Session Loaded", user: "admin@cse.cu.ac.bd" },
  ]);

  // Toast notification helper
  const triggerNotification = (msg: string) => {
    setAlertMessage(msg);
    setAuditLogs(prev => [
      { id: Date.now(), time: "Just now", action: msg, user: "admin@cse.cu.ac.bd" },
      ...prev
    ]);
    setTimeout(() => setAlertMessage(null), 4500);
  };

  // Load all initial data from server API
  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [fetchedBatches, fetchedUsers, fetchedTournaments] = await Promise.all([
        api.batches.getAll().catch(() => []),
        api.users.getAll().catch(() => []),
        api.tournaments.getAll().catch(() => []),
      ]);
      setBatches(fetchedBatches);
      setPlayers(fetchedUsers);
      setTournaments(fetchedTournaments);
      if (fetchedBatches.length > 0) {
        setNewPlayerBatchId(fetchedBatches[0].id);
      }
      if (fetchedTournaments.length > 0) {
        setSelectedTournamentForOrg(fetchedTournaments[0].id);
      }
      if (fetchedUsers.length > 0) {
        setSelectedUserForOrg(fetchedUsers[0].id);
      }
    } catch (err: any) {
      triggerNotification("Failed to load some dashboard data. Is the server running?");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. Handle Batch Creation
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchSession) return;
    try {
      const num = parseInt(newBatchNumber) || batches.length + 18;
      const created = await api.batches.create({
        name: newBatchName,
        session: newBatchSession,
        batchNumber: num,
        slogan: newBatchSlogan || "The Red Brick Champions",
      });
      setBatches(prev => [...prev, created]);
      setShowCreateBatchModal(false);
      setNewBatchName("");
      setNewBatchSession("");
      setNewBatchNumber("");
      setNewBatchSlogan("");
      triggerNotification(`Batch "${created.name}" created successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to create batch.");
    }
  };

  // 2. Handle Player Creation
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerRoll || !newPlayerName) return;
    try {
      const email = newPlayerEmail || `${newPlayerRoll}@cse.cu.ac.bd`;
      const created = await api.users.create({
        studentId: newPlayerRoll,
        name: newPlayerName,
        email: email,
        batchId: newPlayerBatchId,
        cricketRole: newPlayerRole,
        footballPosition: newPlayerPosition,
      });
      setPlayers(prev => [created, ...prev]);
      setShowAddPlayerModal(false);
      setNewPlayerRoll("");
      setNewPlayerName("");
      setNewPlayerEmail("");
      triggerNotification(`Player ${created.name} registered! Generated temp pass: CSEPL@${created.studentId}`);
    } catch (err: any) {
      alert(err.message || "Failed to create player.");
    }
  };

  // 2.2 Handle Reset Temp Password
  const handleResetTempPass = async (player: UserItem) => {
    try {
      const res = await api.users.resetTempPass(player.id);
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, isTemporaryPassword: true } : p));
      triggerNotification(`Reset temp pass for ${player.name}: ${res.temporaryPassword}`);
    } catch (err: any) {
      alert(err.message || "Failed to reset password.");
    }
  };

  // 2.3 Handle Bulk CSV Import
  const handleBulkCsvImport = async () => {
    try {
      const lines = csvContent.trim().split("\n");
      const rows: { roll: string; name: string; email: string; batch?: string; role?: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().startsWith("roll"))) continue;
        const parts = line.split(",").map(p => p.trim());
        if (parts.length >= 2) {
          rows.push({
            roll: parts[0],
            name: parts[1],
            email: parts[2] || `${parts[0]}@cse.cu.ac.bd`,
            batch: parts[3] || "20th Batch",
            role: parts[4] || "🏏 All-Rounder",
          });
        }
      }

      if (rows.length === 0) {
        alert("No valid player rows found in CSV text.");
        return;
      }

      const res = await api.users.bulkImport(rows);
      setShowBulkCsvModal(false);
      setCsvContent("");
      await loadAllData();
      triggerNotification(res.message || `Imported ${rows.length} players with temporary passwords.`);
    } catch (err: any) {
      alert(err.message || "Bulk import failed.");
    }
  };

  // 3. Handle Tournament Creation
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName) return;
    try {
      const created = await api.tournaments.create({
        name: newTournamentName,
        sport: newTournamentSport,
        season: newTournamentSeason,
        rules: { description: newTournamentRules },
      });
      setTournaments(prev => [created, ...prev]);
      setShowCreateTournamentModal(false);
      setNewTournamentName("");
      triggerNotification(`Tournament "${created.name}" created!`);
    } catch (err: any) {
      alert(err.message || "Failed to create tournament.");
    }
  };

  // 3.2 Handle Assign Organizer
  const handleAssignOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentForOrg || !selectedUserForOrg) return;
    try {
      const res = await api.tournaments.assignOrganizer(selectedTournamentForOrg, selectedUserForOrg);
      setShowAssignOrganizerModal(false);
      await loadAllData();
      triggerNotification(res.message || "Assigned organizer successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to assign organizer.");
    }
  };

  // 3.3 Handle Remove Organizer
  const handleRemoveOrganizer = async (tournamentId: number, userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} as an organizer?`)) return;
    try {
      await api.tournaments.removeOrganizer(tournamentId, userId);
      await loadAllData();
      triggerNotification(`Removed ${userName} from tournament organizers.`);
    } catch (err: any) {
      alert(err.message || "Failed to remove organizer.");
    }
  };

  // Filter players by query and batch
  const filteredPlayers = players.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
      p.studentId.includes(playerSearchQuery) ||
      p.email.toLowerCase().includes(playerSearchQuery.toLowerCase());
    const matchesBatch = playerBatchFilter === "ALL" || p.batchId?.toString() === playerBatchFilter;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5DACB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl brick-gradient text-white flex items-center justify-center shadow-md shadow-[#9E2A2B]/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[#2C221E]">
                    CSE<span className="text-[#9E2A2B]">PL</span> Admin Hub
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-[#7C6E63]">Department of CSE, University of Chittagong</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8C7B3] text-xs font-bold text-[#6B5E53] hover:bg-[#F4ECE1] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </Link>

              <button
                onClick={() => {
                  api.auth.logout();
                  navigate("/");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF0E6] hover:bg-[#F5E0D0] text-xs font-bold text-[#842021] border border-[#E8D6C3] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Global Toast Alert */}
      {alertMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#2C221E] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#E8DCCF]/20 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#20C997] shrink-0" />
            <span>{alertMessage}</span>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Batches</span>
              <Layers className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2C221E]">{batches.length}</p>
            <p className="text-[11px] text-[#2A7B54] font-semibold mt-1">18th to 25th + Active</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Registered Players</span>
              <Users className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2C221E]">{players.length}</p>
            <p className="text-[11px] text-[#842021] font-semibold mt-1">
              {players.filter(p => p.isTemporaryPassword).length} on Temp Passwords
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Tournaments</span>
              <Trophy className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2C221E]">{tournaments.length}</p>
            <p className="text-[11px] text-[#2A7B54] font-semibold mt-1">Cricket & Football</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Status</span>
              <Activity className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2A7B54]">Online</p>
            <p className="text-[11px] text-[#7C6E63] font-semibold mt-1">PostgreSQL Connected</p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 bg-[#EDE4D6] p-1.5 rounded-2xl border border-[#DFD2BF] w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("batches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "batches"
                ? "bg-[#9E2A2B] text-white shadow-sm"
                : "text-[#6B5E53] hover:text-[#2C221E]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Batches Management ({batches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "players"
                ? "bg-[#9E2A2B] text-white shadow-sm"
                : "text-[#6B5E53] hover:text-[#2C221E]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players & Temp Passwords ({players.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tournaments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "tournaments"
                ? "bg-[#9E2A2B] text-white shadow-sm"
                : "text-[#6B5E53] hover:text-[#2C221E]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tournaments & Organizers ({tournaments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "logs"
                ? "bg-[#9E2A2B] text-white shadow-sm"
                : "text-[#6B5E53] hover:text-[#2C221E]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loadingData && (
          <div className="py-12 text-center text-[#7C6E63] text-xs font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#9E2A2B]" />
            <span>Syncing database records...</span>
          </div>
        )}

        {/* TAB 1: BATCHES MANAGEMENT */}
        {!loadingData && activeTab === "batches" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C221E]">Academic Batches</h3>
                <p className="text-xs text-[#7C6E63]">Create and manage department batches, sessions, slogans, and rosters</p>
              </div>
              <Button
                onClick={() => setShowCreateBatchModal(true)}
                className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Batch</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {batches.map((b) => (
                <div key={b.id} className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] font-black text-sm flex items-center justify-center border border-[#E8D6C3]">
                        B{b.batchNumber}
                      </div>
                      <span className="text-[10px] font-bold text-[#7C6E63] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8DCCF]">
                        Session: {b.session}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-[#2C221E]">{b.name}</h4>
                    <p className="text-xs text-[#9E2A2B] font-semibold">{b.slogan || "Red Brick Champions"}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                    <span>👥 {b.studentsCount} Students</span>
                    <span className="font-semibold text-[#842021]">🏆 {b.teamsCount} Teams</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PLAYERS & TEMPORARY PASSWORDS */}
        {!loadingData && activeTab === "players" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C221E]">Players & Temporary Passwords</h3>
                <p className="text-xs text-[#7C6E63]">Create individual players, issue temporary credentials, and bulk import via CSV</p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkCsvModal(true)}
                  className="border-[#D8C7B3] text-[#6B1C1D] text-xs font-bold h-10 px-3.5 rounded-xl hover:bg-[#F4ECE1]"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#9E2A2B]" />
                  <span>Bulk Import CSV</span>
                </Button>

                <Button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Player</span>
                </Button>
              </div>
            </div>

            {/* Search & Batch Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-white p-3 rounded-2xl border border-[#E5DACB] flex items-center gap-3">
                <Search className="w-4 h-4 text-[#7C6E63] ml-2" />
                <input
                  type="text"
                  placeholder="Search by Roll Number, Name, or Email..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#2C221E] focus:outline-none"
                />
                {playerSearchQuery && (
                  <button onClick={() => setPlayerSearchQuery("")} className="text-xs text-[#7C6E63] mr-2">
                    Clear
                  </button>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-2xl border border-[#E5DACB] flex items-center">
                <select
                  value={playerBatchFilter}
                  onChange={(e) => setPlayerBatchFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#2C221E] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Batches ({players.length})</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id.toString()}>{b.name} ({b.session})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Players Table */}
            <div className="bg-white rounded-3xl border border-[#E5DACB] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#E5DACB] text-[#7C6E63] uppercase text-[10px] font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student ID / Roll</th>
                      <th className="py-3.5 px-4">Name & Email</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Sports Roles</th>
                      <th className="py-3.5 px-4">Password Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8DC]">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#7C6E63]">
                          No registered players found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#2C221E]">
                            {player.studentId}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-[#2C221E]">{player.name}</p>
                            <p className="text-[11px] text-[#7C6E63]">{player.email}</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#842021]">
                            {player.batch}
                          </td>
                          <td className="py-3.5 px-4 text-[#6B5E53]">
                            <span>{player.cricketRole || "🏏 Player"}</span>
                            {player.footballPosition && <span className="ml-1 text-[11px]">/ {player.footballPosition}</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            {player.isTemporaryPassword ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded border border-[#E8D6C3]">
                                  CSEPL@{player.studentId}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`CSEPL@${player.studentId}`);
                                    triggerNotification(`Copied temp pass for ${player.name} to clipboard!`);
                                  }}
                                  title="Copy temp pass"
                                  className="p-1 text-[#7C6E63] hover:text-[#9E2A2B]"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#2A7B54] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Password Set
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleResetTempPass(player)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] hover:text-[#842021] bg-[#FAF0E6] hover:bg-[#F5E0D0] px-2.5 py-1 rounded-lg border border-[#E8D6C3] transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reset Pass</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOURNAMENTS & ORGANIZERS */}
        {!loadingData && activeTab === "tournaments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C221E]">Tournaments & Delegated Organizers</h3>
                <p className="text-xs text-[#7C6E63]">Create tournaments, configure rules, and assign student organizers</p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignOrganizerModal(true)}
                  className="border-[#D8C7B3] text-[#6B1C1D] text-xs font-bold h-10 px-3.5 rounded-xl hover:bg-[#F4ECE1]"
                >
                  <UserCheck className="w-4 h-4 mr-1.5 text-[#9E2A2B]" />
                  <span>Assign Organizers</span>
                </Button>

                <Button
                  onClick={() => setShowCreateTournamentModal(true)}
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Tournament</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                      {t.sport === "CRICKET" ? "🏏 Cricket" : "⚽ Football"}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-[#2C221E]">{t.name}</h4>
                    <p className="text-xs text-[#7C6E63] mt-0.5">Season: {t.season} · {t.teamsCount} Teams registered</p>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-xs space-y-1">
                    <p className="font-bold text-[#7C6E63] text-[10px] uppercase">Format & Specifications</p>
                    <p className="text-[#2C221E] font-medium">
                      {typeof t.rules === "object" ? JSON.stringify(t.rules) : (t.rules || "Standard CSE Tournament Rules")}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
                    <p className="text-[11px] font-bold text-[#7C6E63] uppercase">Assigned Tournament Organizers:</p>
                    {t.organizers.length === 0 ? (
                      <p className="text-xs text-[#7C6E63] italic">No student organizers assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {t.organizers.map((org) => (
                          <span key={org.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                            <span>👤 {org.name} ({org.roll})</span>
                            <button
                              onClick={() => handleRemoveOrganizer(t.id, org.id, org.name)}
                              title="Remove organizer"
                              className="text-[#9E2A2B] hover:text-[#6F1819]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-[#2C221E]">System Audit & Activity Trail</h3>
              <p className="text-xs text-[#7C6E63]">Real-time history of administrative actions on batches, players, and permissions</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5DACB] shadow-xs p-5 space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DCCF] text-xs">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[#2C221E]">{log.action}</p>
                    <p className="text-[11px] text-[#7C6E63]">By: {log.user}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#842021] bg-white px-2.5 py-1 rounded-lg border border-[#E5DACB]">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* CREATE BATCH MODAL */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCreateBatchModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-[#2C221E] mb-4">Create New Academic Batch</h3>
            
            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26th Batch"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Academic Session</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-25"
                  value={newBatchSession}
                  onChange={(e) => setNewBatchSession(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Number</label>
                <input
                  type="number"
                  placeholder="e.g. 26"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Slogan / Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. The Quantum Knights"
                  value={newBatchSlogan}
                  onChange={(e) => setNewBatchSlogan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateBatchModal(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Save Batch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SINGLE PLAYER MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAddPlayerModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-[#2C221E] mb-2">Register Player / Student</h3>
            <p className="text-xs text-[#7C6E63] mb-4">A temporary password will be auto-generated for the student's initial sign-in.</p>
            
            <form onSubmit={handleAddPlayer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Student ID / Roll</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20701055"
                  value={newPlayerRoll}
                  onChange={(e) => setNewPlayerRoll(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahmudul Hasan"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. 20701055@cse.cu.ac.bd"
                  value={newPlayerEmail}
                  onChange={(e) => setNewPlayerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Assignment</label>
                <select
                  value={newPlayerBatchId || ""}
                  onChange={(e) => setNewPlayerBatchId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.session})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Cricket Role</label>
                  <select
                    value={newPlayerRole}
                    onChange={(e) => setNewPlayerRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E]"
                  >
                    <option value="🏏 Top-Order Bat">🏏 Top-Order Bat</option>
                    <option value="🏏 All-Rounder">🏏 All-Rounder</option>
                    <option value="🏏 Fast Bowler">🏏 Fast Bowler</option>
                    <option value="🏏 Spin Bowler">🏏 Spin Bowler</option>
                    <option value="🏏 Wicketkeeper">🏏 Wicketkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Football Role</label>
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E]"
                  >
                    <option value="⚽ Forward">⚽ Forward</option>
                    <option value="⚽ Midfielder">⚽ Midfielder</option>
                    <option value="⚽ Defender">⚽ Defender</option>
                    <option value="⚽ Goalkeeper">⚽ Goalkeeper</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF0E6] rounded-xl border border-[#E8D6C3] text-[11px] text-[#842021]">
                <strong>Generated Temp Pass:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded ml-1">CSEPL@{newPlayerRoll || "Roll"}</code>
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddPlayerModal(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Register Player
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {showBulkCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowBulkCsvModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2C221E]">Bulk Import Batch Players (CSV)</h3>
                <p className="text-xs text-[#7C6E63]">Paste CSV text containing Roll, Name, Email, and Batch</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-xs space-y-1.5 mb-3">
              <p className="font-bold text-[#2C221E]">Expected CSV Columns: <code className="font-mono text-[#9E2A2B]">Roll, Name, Email, Batch, Role</code></p>
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="19701042, Sanzid Rahman, sanzid@cse.cu.ac.bd, 20th Batch, 🏏 Top-Order Bat
19701015, Tanvir Ahmed, tanvir@cse.cu.ac.bd, 20th Batch, 🏏 All-Rounder"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
              />
            </div>

            <div className="pt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkCsvModal(false)} className="w-1/2 rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleBulkCsvImport}
                className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs"
              >
                Upload & Generate Passes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {showCreateTournamentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCreateTournamentModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-[#2C221E] mb-4">Initialize New Tournament</h3>
            
            <form onSubmit={handleCreateTournament} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Premier League 2027"
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Sport Mode</label>
                <select
                  value={newTournamentSport}
                  onChange={(e) => setNewTournamentSport(e.target.value as "CRICKET" | "FOOTBALL")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  <option value="CRICKET">🏏 Cricket (T10 / T20)</option>
                  <option value="FOOTBALL">⚽ Football (Futsal / Full)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Season / Year</label>
                <input
                  type="text"
                  value={newTournamentSeason}
                  onChange={(e) => setNewTournamentSeason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Rules & Custom Specifications</label>
                <textarea
                  rows={2}
                  value={newTournamentRules}
                  onChange={(e) => setNewTournamentRules(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateTournamentModal(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Create League
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ORGANIZER MODAL */}
      {showAssignOrganizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAssignOrganizerModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-black text-[#2C221E] mb-2">Delegate Tournament Organizer</h3>
            <p className="text-xs text-[#7C6E63] mb-4">Granting organizing rights allows the student to manage teams, fixtures, and scorers for that tournament.</p>
            
            <form onSubmit={handleAssignOrganizer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Target Tournament</label>
                <select
                  value={selectedTournamentForOrg || ""}
                  onChange={(e) => setSelectedTournamentForOrg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Select Student / User</label>
                <select
                  value={selectedUserForOrg || ""}
                  onChange={(e) => setSelectedUserForOrg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Roll: {p.studentId}) · {p.batch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAssignOrganizerModal(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Grant Organizer Permission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
