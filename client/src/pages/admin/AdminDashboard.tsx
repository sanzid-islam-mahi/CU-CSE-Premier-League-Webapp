import React, { useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"batches" | "players" | "tournaments" | "logs">("batches");
  
  // Notice alert state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // 1. Batches State
  const [batches, setBatches] = useState([
    { id: 18, name: "18th Batch", session: "2016-17", batchNumber: 18, slogan: "The Veteran Titans", studentsCount: 16, trophies: 2 },
    { id: 19, name: "19th Batch", session: "2017-18", batchNumber: 19, slogan: "The Legacy Pioneers", studentsCount: 18, trophies: 3 },
    { id: 20, name: "20th Batch", session: "2018-19", batchNumber: 20, slogan: "The Invincible Titans", studentsCount: 22, trophies: 4 },
    { id: 21, name: "21st Batch", session: "2019-20", batchNumber: 21, slogan: "The Red Brick Warriors", studentsCount: 24, trophies: 3 },
    { id: 22, name: "22nd Batch", session: "2020-21", batchNumber: 22, slogan: "The Rising Royals", studentsCount: 20, trophies: 1 },
    { id: 23, name: "23rd Batch", session: "2021-22", batchNumber: 23, slogan: "The Challengers", studentsCount: 22, trophies: 0 },
    { id: 24, name: "24th Batch", session: "2022-23", batchNumber: 24, slogan: "The Spark Pioneers", studentsCount: 18, trophies: 0 },
    { id: 25, name: "25th Batch", session: "2023-24", batchNumber: 25, slogan: "The Fresh Gladiators", studentsCount: 20, trophies: 0 },
  ]);

  // Batch Modal State
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSession, setNewBatchSession] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchSlogan, setNewBatchSlogan] = useState("");

  // 2. Players & Temp Passwords State
  const [players, setPlayers] = useState([
    { id: 1, roll: "19701042", name: "Sanzid Rahman", email: "sanzid@cse.cu.ac.bd", batch: "20th Batch", role: "🏏 Bat / ⚽ Fwd", tempPass: "CSEPL@19701042", isTemp: true },
    { id: 2, roll: "19701015", name: "Tanvir Ahmed", email: "tanvir@cse.cu.ac.bd", batch: "20th Batch", role: "🏏 All / ⚽ Mid", tempPass: null, isTemp: false },
    { id: 3, roll: "20701004", name: "Farhan Kabir", email: "farhan@cse.cu.ac.bd", batch: "21st Batch", role: "🏏 Fast / ⚽ Def", tempPass: "CSEPL@20701004", isTemp: true },
    { id: 4, roll: "20701028", name: "Rafid Hasan", email: "rafid@cse.cu.ac.bd", batch: "21st Batch", role: "🏏 Bat / ⚽ Fwd", tempPass: null, isTemp: false },
    { id: 5, roll: "21701033", name: "Nahid Islam", email: "nahid@cse.cu.ac.bd", batch: "22nd Batch", role: "🏏 Spin / ⚽ Mid", tempPass: "CSEPL@21701033", isTemp: true },
    { id: 6, roll: "21701050", name: "Shakil Hossain", email: "shakil@cse.cu.ac.bd", batch: "22nd Batch", role: "🏏 All / ⚽ Fwd", tempPass: "CSEPL@21701050", isTemp: true },
  ]);

  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showBulkCsvModal, setShowBulkCsvModal] = useState(false);
  const [newPlayerRoll, setNewPlayerRoll] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [newPlayerBatch, setNewPlayerBatch] = useState("20th Batch");
  const [newPlayerRole, setNewPlayerRole] = useState("🏏 All-Rounder / ⚽ Midfielder");

  // 3. Tournaments & Organizers State
  const [tournaments, setTournaments] = useState([
    {
      id: 1,
      name: "CSE Premier League 2026",
      sport: "Cricket (T10)",
      season: "2026",
      status: "ONGOING",
      organizers: ["Sanzid Rahman (Roll: 19701042)", "Tanvir Ahmed (Roll: 19701015)"],
      teamsCount: 8,
      rules: "10 overs per side, 2 overs max per bowler, NRR table",
    },
    {
      id: 2,
      name: "CSE Futsal Champions Cup 2026",
      sport: "Football (7-a-side)",
      season: "2026",
      status: "ONGOING",
      organizers: ["Rafid Hasan (Roll: 20701028)", "Nahid Islam (Roll: 21701033)"],
      teamsCount: 8,
      rules: "20 min halves, 5 field + 1 GK + 1 floating, GD table",
    }
  ]);

  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);
  const [showAssignOrganizerModal, setShowAssignOrganizerModal] = useState(false);
  const [selectedTournamentForOrg, setSelectedTournamentForOrg] = useState(1);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentSport, setNewTournamentSport] = useState("Cricket (T10)");
  const [newTournamentSeason, setNewTournamentSeason] = useState("2026");
  const [newTournamentRules, setNewTournamentRules] = useState("Standard CSE League format");
  const [organizerStudentSelect, setOrganizerStudentSelect] = useState("Farhan Kabir (Roll: 20701004)");

  // 4. Audit Logs State
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: "Just now", action: "Admin Portal Accessed", user: "admin@cse.cu.ac.bd", ip: "10.12.4.88" },
    { id: 2, time: "10 mins ago", action: "Temporary pass generated for Roll 21701050", user: "Admin", ip: "10.12.4.88" },
    { id: 3, time: "1 hour ago", action: "Assigned Organizer permissions for CSE Futsal Cup 2026 to Rafid Hasan", user: "Admin", ip: "10.12.4.88" },
    { id: 4, time: "3 hours ago", action: "Created Tournament: CSE Premier League 2026 (Cricket T10)", user: "Admin", ip: "10.12.4.88" },
  ]);

  // Handlers
  const triggerNotification = (msg: string) => {
    setAlertMessage(msg);
    setAuditLogs(prev => [
      { id: Date.now(), time: "Just now", action: msg, user: "admin@cse.cu.ac.bd", ip: "10.12.4.88" },
      ...prev
    ]);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchSession) return;
    const num = parseInt(newBatchNumber) || batches.length + 18;
    const newBatch = {
      id: num,
      name: newBatchName,
      session: newBatchSession,
      batchNumber: num,
      slogan: newBatchSlogan || "The Champions",
      studentsCount: 0,
      trophies: 0,
    };
    setBatches([...batches, newBatch]);
    setShowCreateBatchModal(false);
    setNewBatchName("");
    setNewBatchSession("");
    setNewBatchNumber("");
    setNewBatchSlogan("");
    triggerNotification(`Batch "${newBatch.name}" created successfully!`);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerRoll || !newPlayerName) return;
    const tempPass = `CSEPL@${newPlayerRoll}`;
    const newPlayer = {
      id: players.length + 1,
      roll: newPlayerRoll,
      name: newPlayerName,
      email: newPlayerEmail || `${newPlayerRoll}@cse.cu.ac.bd`,
      batch: newPlayerBatch,
      role: newPlayerRole,
      tempPass: tempPass,
      isTemp: true,
    };
    setPlayers([newPlayer, ...players]);
    setShowAddPlayerModal(false);
    setNewPlayerRoll("");
    setNewPlayerName("");
    setNewPlayerEmail("");
    triggerNotification(`Player ${newPlayer.name} added with temp pass: ${tempPass}`);
  };

  const handleResetTempPass = (player: typeof players[0]) => {
    const freshPass = `CSEPL@${player.roll}_${Math.floor(100 + Math.random() * 900)}`;
    setPlayers(players.map(p => p.id === player.id ? { ...p, tempPass: freshPass, isTemp: true } : p));
    triggerNotification(`Reset temp pass for ${player.name}: ${freshPass}`);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName) return;
    const newTourn = {
      id: tournaments.length + 1,
      name: newTournamentName,
      sport: newTournamentSport,
      season: newTournamentSeason,
      status: "UPCOMING",
      organizers: ["Admin Delegated"],
      teamsCount: 8,
      rules: newTournamentRules,
    };
    setTournaments([...tournaments, newTourn]);
    setShowCreateTournamentModal(false);
    setNewTournamentName("");
    triggerNotification(`Tournament "${newTourn.name}" initialized!`);
  };

  const handleAssignOrganizer = (e: React.FormEvent) => {
    e.preventDefault();
    setTournaments(tournaments.map(t => {
      if (t.id === selectedTournamentForOrg) {
        return { ...t, organizers: [...t.organizers, organizerStudentSelect] };
      }
      return t;
    }));
    setShowAssignOrganizerModal(false);
    triggerNotification(`Assigned ${organizerStudentSelect} as Organizer!`);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    p.roll.includes(playerSearchQuery) ||
    p.batch.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

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
                onClick={() => navigate("/")}
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
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Players</span>
              <Users className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2C221E]">{players.length + 136}</p>
            <p className="text-[11px] text-[#842021] font-semibold mt-1">{players.filter(p => p.isTemp).length} on Temp Passwords</p>
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
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Matches Today</span>
              <Activity className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <p className="text-2xl font-black text-[#2C221E]">2</p>
            <p className="text-[11px] text-[#9E2A2B] font-bold mt-1">1 Match Live Now</p>
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
            <span>Batches Management</span>
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
            <span>Players & Temp Passwords</span>
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
            <span>Tournaments & Organizers</span>
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

        {/* TAB 1: BATCHES MANAGEMENT */}
        {activeTab === "batches" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C221E]">Academic Batches</h3>
                <p className="text-xs text-[#7C6E63]">Manage department batches, sessions, slogans, and stats</p>
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
                    <p className="text-xs text-[#9E2A2B] font-semibold">{b.slogan}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                    <span>👥 {b.studentsCount} Students</span>
                    <span className="font-bold text-[#D96B27]">🏆 {b.trophies} Titles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PLAYERS & TEMPORARY PASSWORDS */}
        {activeTab === "players" && (
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

            {/* Search Input Bar */}
            <div className="bg-white p-3 rounded-2xl border border-[#E5DACB] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#7C6E63] ml-2" />
              <input
                type="text"
                placeholder="Search by Roll Number, Name, or Batch..."
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
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#2C221E]">
                          {player.roll}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-[#2C221E]">{player.name}</p>
                          <p className="text-[11px] text-[#7C6E63]">{player.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#842021]">
                          {player.batch}
                        </td>
                        <td className="py-3.5 px-4 text-[#6B5E53]">
                          {player.role}
                        </td>
                        <td className="py-3.5 px-4">
                          {player.isTemp ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded border border-[#E8D6C3]">
                                {player.tempPass}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(player.tempPass || "");
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOURNAMENTS & ORGANIZERS */}
        {activeTab === "tournaments" && (
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
                      {t.sport}
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
                    <p className="font-bold text-[#7C6E63] text-[10px] uppercase">Format & Rules</p>
                    <p className="text-[#2C221E] font-medium">{t.rules}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
                    <p className="text-[11px] font-bold text-[#7C6E63] uppercase">Assigned Tournament Organizers:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.organizers.map((org, idx) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                          👤 {org}
                        </span>
                      ))}
                    </div>
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
                    <p className="text-[11px] text-[#7C6E63]">By: {log.user} (IP: {log.ip})</p>
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
            <h3 className="text-lg font-black text-[#2C221E] mb-2">Add Registered Player</h3>
            <p className="text-xs text-[#7C6E63] mb-4">A temporary password will be auto-generated for the student's first sign-in.</p>
            
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
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Assignment</label>
                <select
                  value={newPlayerBatch}
                  onChange={(e) => setNewPlayerBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name} ({b.session})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Playing Style / Roles</label>
                <select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  <option value="🏏 All-Rounder / ⚽ Midfielder">🏏 All-Rounder / ⚽ Midfielder</option>
                  <option value="🏏 Top-Order Bat / ⚽ Forward">🏏 Top-Order Bat / ⚽ Forward</option>
                  <option value="🏏 Fast Bowler / ⚽ Defender">🏏 Fast Bowler / ⚽ Defender</option>
                  <option value="🏏 Wicketkeeper / ⚽ Goalkeeper">🏏 Wicketkeeper / ⚽ Goalkeeper</option>
                </select>
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
                <p className="text-xs text-[#7C6E63]">Upload a CSV file containing Roll, Name, Email, and Batch</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-xs space-y-2 mb-4">
              <p className="font-bold text-[#2C221E]">Expected CSV Format:</p>
              <pre className="p-2.5 bg-white rounded-xl border border-[#E5DACB] text-[11px] font-mono text-[#842021] overflow-x-auto">
{`Roll,Name,Email,Batch
19701042,Sanzid Rahman,sanzid@cse.cu.ac.bd,20th Batch
19701015,Tanvir Ahmed,tanvir@cse.cu.ac.bd,20th Batch
20701004,Farhan Kabir,farhan@cse.cu.ac.bd,21st Batch`}
              </pre>
            </div>

            <div className="border-2 border-dashed border-[#D8C7B3] rounded-2xl p-6 text-center space-y-2 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
              <FileSpreadsheet className="w-8 h-8 text-[#9E2A2B] mx-auto opacity-80" />
              <p className="text-xs font-bold text-[#2C221E]">Click or drag & drop your student CSV file here</p>
              <p className="text-[10px] text-[#7C6E63]">Auto-generates temporary passwords for all imported rows</p>
            </div>

            <div className="pt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkCsvModal(false)} className="w-1/2 rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowBulkCsvModal(false);
                  triggerNotification("Successfully simulated bulk import of 45 students with auto temp passes!");
                }}
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
                <label className="block font-bold text-[#4A3E35] mb-1">Sport Mode & Format</label>
                <select
                  value={newTournamentSport}
                  onChange={(e) => setNewTournamentSport(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  <option value="Cricket (T10)">🏏 Cricket (T10 - 10 Overs)</option>
                  <option value="Cricket (T20)">🏏 Cricket (T20 - 20 Overs)</option>
                  <option value="Cricket (6 Overs)">🏏 Cricket (Super Sixes - 6 Overs)</option>
                  <option value="Football (7-a-side)">⚽ Football (7-a-side Futsal)</option>
                  <option value="Football (11-a-side)">⚽ Football (11-a-side Full Field)</option>
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
                  value={selectedTournamentForOrg}
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
                  value={organizerStudentSelect}
                  onChange={(e) => setOrganizerStudentSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {players.map(p => (
                    <option key={p.id} value={`${p.name} (Roll: ${p.roll})`}>
                      {p.name} (Roll: {p.roll}) · {p.batch}
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
