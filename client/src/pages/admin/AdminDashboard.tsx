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
  Trash2,
  Loader2,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type BatchItem, type UserItem, type TournamentItem } from "@/lib/api";
import { toast } from "@/context/ToastContext";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"batches" | "players" | "tournaments" | "logs">("batches");
  const [loadingData, setLoadingData] = useState(true);

  // 1. Batches State & Search
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showAssignBatchModModal, setShowAssignBatchModModal] = useState(false);
  const [selectedBatchForMod, setSelectedBatchForMod] = useState<number | null>(null);
  const [selectedUserForMod, setSelectedUserForMod] = useState<number | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSession, setNewBatchSession] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchSlogan, setNewBatchSlogan] = useState("");
  const [editingBatch, setEditingBatch] = useState<any | null>(null);

  // 2. Players State & Search
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
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);

  // 3. Tournaments State & Search
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [tournamentSearchQuery, setTournamentSearchQuery] = useState("");
  const [tournamentSportFilter, setTournamentSportFilter] = useState<string>("ALL");
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);
  const [showAssignOrganizerModal, setShowAssignOrganizerModal] = useState(false);
  const [selectedTournamentForOrg, setSelectedTournamentForOrg] = useState<number | null>(null);
  const [selectedUserForOrg, setSelectedUserForOrg] = useState<number | null>(null);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentSport, setNewTournamentSport] = useState<"CRICKET" | "FOOTBALL">("CRICKET");
  const [newTournamentSeason, setNewTournamentSeason] = useState("2026");
  const [newTournamentOvers, setNewTournamentOvers] = useState("10");
  const [newTournamentBowlerMax, setNewTournamentBowlerMax] = useState("2");
  const [newTournamentFormatText, setNewTournamentFormatText] = useState("7-a-side Futsal");
  const [newTournamentHalfMins, setNewTournamentHalfMins] = useState("20");
  const [editingTournament, setEditingTournament] = useState<any | null>(null);

  // 4. Audit Logs State
  const [auditLogs, setAuditLogs] = useState<{ id: number; time: string; action: string; user: string }[]>([
    { id: 1, time: "Initial", action: "Admin Session Loaded", user: "admin@cse.cu.ac.bd" },
  ]);

  // Toast notification helper
  const triggerNotification = (msg: string) => {
    toast.success(msg);
    setAuditLogs(prev => [
      { id: Date.now(), time: "Just now", action: msg, user: "admin@cse.cu.ac.bd" },
      ...prev
    ]);
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
    } catch {
      triggerNotification("Failed to load some dashboard data. Is the server running?");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. Batch Operations
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
      toast.error(err.message || "Failed to create batch.");
    }
  };

  const handleOpenEditBatch = (batch: BatchItem) => {
    setEditingBatch({
      id: batch.id,
      name: batch.name,
      session: batch.session,
      batchNumber: batch.batchNumber,
      slogan: batch.slogan || "",
      avatarUrl: batch.avatarUrl || "",
      bannerUrl: batch.bannerUrl || "",
    });
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      const updated = await api.batches.update(editingBatch.id, {
        name: editingBatch.name,
        session: editingBatch.session,
        batchNumber: Number(editingBatch.batchNumber),
        slogan: editingBatch.slogan || undefined,
        avatarUrl: editingBatch.avatarUrl || undefined,
        bannerUrl: editingBatch.bannerUrl || undefined,
      });
      setBatches(prev => prev.map(b => b.id === editingBatch.id ? { ...b, ...updated } : b));
      setEditingBatch(null);
      triggerNotification(`Batch "${updated.name}" updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch.");
    }
  };

  const handleDeleteBatch = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? Associated users will be unassigned.`)) return;
    try {
      await api.batches.delete(id);
      setBatches(prev => prev.filter(b => b.id !== id));
      triggerNotification(`Batch "${name}" deleted.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete batch.");
    }
  };

  const handleOpenAssignBatchModModal = (batchId: number) => {
    setSelectedBatchForMod(batchId);
    const batchStudents = players.filter(p => p.batchId === batchId);
    if (batchStudents.length > 0) {
      setSelectedUserForMod(batchStudents[0].id);
    } else if (players.length > 0) {
      setSelectedUserForMod(players[0].id);
    }
    setShowAssignBatchModModal(true);
  };

  const handleAssignBatchModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForMod || !selectedUserForMod) return;
    try {
      const res = await api.batches.assignModerator(selectedBatchForMod, selectedUserForMod);
      setShowAssignBatchModModal(false);
      await loadAllData();
      triggerNotification(res.message || "Assigned batch moderator successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign batch moderator.");
    }
  };

  const handleRemoveBatchModerator = async (batchId: number, userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} as a batch moderator?`)) return;
    try {
      await api.batches.removeModerator(batchId, userId);
      await loadAllData();
      triggerNotification(`Removed ${userName} as batch moderator.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove batch moderator.");
    }
  };

  // 2. Player Operations
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerRoll || !newPlayerName) return;
    try {
      const email = newPlayerEmail && newPlayerEmail.trim() ? newPlayerEmail.trim() : undefined;
      const created = await api.users.create({
        studentId: newPlayerRoll,
        name: newPlayerName,
        email: email,
        batchId: newPlayerBatchId,
      });
      setPlayers(prev => [created, ...prev]);
      setShowAddPlayerModal(false);
      setNewPlayerRoll("");
      setNewPlayerName("");
      setNewPlayerEmail("");
      triggerNotification(`Player ${created.name} registered! Generated temp pass: CSEPL@${created.studentId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create player.");
    }
  };

  const handleOpenEditPlayer = (player: UserItem) => {
    setEditingPlayer({
      id: player.id,
      studentId: player.studentId,
      name: player.name,
      email: player.email || "",
      batchId: player.batchId || "",
      role: player.role || "USER",
      cricketRole: player.cricketRole || "",
      footballPosition: player.footballPosition || "",
    });
  };

  const handleSaveEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    try {
      const updated = await api.users.update(editingPlayer.id, {
        studentId: editingPlayer.studentId,
        name: editingPlayer.name,
        email: editingPlayer.email || undefined,
        batchId: editingPlayer.batchId ? Number(editingPlayer.batchId) : null,
        role: editingPlayer.role,
        cricketRole: editingPlayer.cricketRole || null,
        footballPosition: editingPlayer.footballPosition || null,
      });
      setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...updated } : p));
      setEditingPlayer(null);
      triggerNotification(`Player ${updated.name} (Roll: ${updated.studentId}) updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update player.");
    }
  };

  const handleDeletePlayer = async (id: number, name: string, roll: string) => {
    if (!confirm(`Are you sure you want to delete player ${name} (Roll: ${roll})?`)) return;
    try {
      await api.users.delete(id);
      setPlayers(prev => prev.filter(p => p.id !== id));
      triggerNotification(`Deleted player ${name} (Roll: ${roll}).`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete player.");
    }
  };

  const handleResetTempPass = async (player: UserItem) => {
    try {
      const res = await api.users.resetTempPass(player.id);
      setPlayers(prev => prev.map(p => p.id === player.id ? { 
        ...p, 
        isTemporaryPassword: true, 
        temporaryPlainPassword: res.temporaryPassword 
      } : p));
      triggerNotification(`Reset temp pass for ${player.name}: ${res.temporaryPassword}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    }
  };

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
        toast.warning("No valid player rows found in CSV text.");
        return;
      }

      const res = await api.users.bulkImport(rows);
      setShowBulkCsvModal(false);
      setCsvContent("");
      await loadAllData();
      triggerNotification(res.message || `Imported ${rows.length} players with temporary passwords.`);
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed.");
    }
  };

  // 3. Tournament Operations
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName) return;
    try {
      let rulesObj: any = {};
      if (newTournamentSport === "CRICKET") {
        rulesObj = {
          overs: parseInt(newTournamentOvers) || 10,
          maxPerBowler: parseInt(newTournamentBowlerMax) || 2,
          powerplay: Math.max(1, Math.floor((parseInt(newTournamentOvers) || 10) / 4)),
          pointsWin: 2,
          pointsTie: 1,
        };
      } else {
        rulesObj = {
          format: newTournamentFormatText || "7-a-side",
          halfMinutes: parseInt(newTournamentHalfMins) || 20,
          pointsWin: 3,
          pointsDraw: 1,
        };
      }

      const created = await api.tournaments.create({
        name: newTournamentName,
        sport: newTournamentSport,
        season: newTournamentSeason,
        rules: rulesObj,
      });
      setTournaments(prev => [created, ...prev]);
      setShowCreateTournamentModal(false);
      setNewTournamentName("");
      triggerNotification(`Tournament "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create tournament.");
    }
  };

  const handleOpenEditTournament = (tournament: TournamentItem) => {
    let rules = tournament.rules;
    if (typeof rules === "string") {
      try { rules = JSON.parse(rules); } catch { rules = {}; }
    }
    rules = rules || {};

    setEditingTournament({
      id: tournament.id,
      name: tournament.name,
      season: tournament.season,
      sport: tournament.sport,
      status: tournament.status || "UPCOMING",
      bannerUrl: tournament.bannerUrl || "",
      logoUrl: tournament.logoUrl || "",
      overs: rules.overs?.toString() || "10",
      maxPerBowler: rules.maxPerBowler?.toString() || "2",
      powerplay: rules.powerplay?.toString() || "2",
      format: rules.format || "7-a-side",
      halfMinutes: rules.halfMinutes?.toString() || "20",
      pointsWin: (tournament.sport === "CRICKET" ? rules.pointsWin ?? 2 : rules.pointsWin ?? 3).toString(),
      pointsTieDraw: (tournament.sport === "CRICKET" ? rules.pointsTie ?? 1 : rules.pointsDraw ?? 1).toString(),
    });
  };

  const handleSaveEditTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    try {
      let rulesObj: any = {};
      if (editingTournament.sport === "CRICKET") {
        rulesObj = {
          overs: parseInt(editingTournament.overs) || 10,
          maxPerBowler: parseInt(editingTournament.maxPerBowler) || 2,
          powerplay: parseInt(editingTournament.powerplay) || 2,
          pointsWin: parseInt(editingTournament.pointsWin) || 2,
          pointsTie: parseInt(editingTournament.pointsTieDraw) || 1,
        };
      } else {
        rulesObj = {
          format: editingTournament.format || "7-a-side",
          halfMinutes: parseInt(editingTournament.halfMinutes) || 20,
          pointsWin: parseInt(editingTournament.pointsWin) || 3,
          pointsDraw: parseInt(editingTournament.pointsTieDraw) || 1,
        };
      }

      const updated = await api.tournaments.update(editingTournament.id, {
        name: editingTournament.name,
        season: editingTournament.season,
        sport: editingTournament.sport,
        status: editingTournament.status,
        rules: rulesObj,
        bannerUrl: editingTournament.bannerUrl || null,
        logoUrl: editingTournament.logoUrl || null,
      });

      setTournaments(prev => prev.map(t => t.id === editingTournament.id ? { ...t, ...updated, rules: rulesObj } : t));
      setEditingTournament(null);
      triggerNotification(`Tournament "${updated.name}" updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update tournament.");
    }
  };

  const handleDeleteTournament = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete tournament "${name}" and all its fixtures?`)) return;
    try {
      await api.tournaments.delete(id);
      setTournaments(prev => prev.filter(t => t.id !== id));
      triggerNotification(`Tournament "${name}" deleted.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tournament.");
    }
  };

  const handleOpenAssignModalForTournament = (tournamentId: number) => {
    setSelectedTournamentForOrg(tournamentId);
    setShowAssignOrganizerModal(true);
  };

  const handleAssignOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentForOrg || !selectedUserForOrg) return;
    try {
      const res = await api.tournaments.assignOrganizer(selectedTournamentForOrg, selectedUserForOrg);
      setShowAssignOrganizerModal(false);
      await loadAllData();
      triggerNotification(res.message || "Assigned organizer successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign organizer.");
    }
  };

  const handleRemoveOrganizer = async (tournamentId: number, userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} as an organizer?`)) return;
    try {
      await api.tournaments.removeOrganizer(tournamentId, userId);
      await loadAllData();
      triggerNotification(`Removed ${userName} from tournament organizers.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove organizer.");
    }
  };

  // Human-readable Format & Specifications Pill Renderer
  const renderRulesPills = (rules: any, sport: "CRICKET" | "FOOTBALL") => {
    if (!rules) {
      return (
        <span className="text-xs text-[#7C6E63] italic">Standard Department Rules</span>
      );
    }

    let parsed = rules;
    if (typeof rules === "string") {
      try {
        parsed = JSON.parse(rules);
      } catch {
        return <span className="text-xs font-medium text-[#2C221E]">{rules}</span>;
      }
    }

    if (sport === "CRICKET") {
      const overs = parsed.overs ?? 10;
      const maxBowler = parsed.maxPerBowler ?? 2;
      const powerplay = parsed.powerplay ?? 2;
      const pointsWin = parsed.pointsWin ?? 2;
      const pointsTie = parsed.pointsTie ?? 1;

      return (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DACB] text-[11px] font-bold text-[#842021]">
            🏏 {overs} Overs / Side
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DACB] text-[11px] font-bold text-[#6B5E53]">
            🎯 Max {maxBowler} ov/bowler
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DACB] text-[11px] font-bold text-[#6B5E53]">
            ⚡ {powerplay} Ov Powerplay
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#FAF0E6] border border-[#E8D6C3] text-[11px] font-extrabold text-[#9E2A2B]">
            🏆 Win: {pointsWin} pts · Tie: {pointsTie} pt
          </span>
        </div>
      );
    } else {
      const halfMins = parsed.halfMinutes ?? 20;
      const format = parsed.format ?? "7-a-side";
      const pointsWin = parsed.pointsWin ?? 3;
      const pointsDraw = parsed.pointsDraw ?? 1;

      return (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DACB] text-[11px] font-bold text-[#842021]">
            ⏱️ {halfMins} Min Halves
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DACB] text-[11px] font-bold text-[#6B5E53]">
            👥 {format} Format
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#FAF0E6] border border-[#E8D6C3] text-[11px] font-extrabold text-[#9E2A2B]">
            🏆 Win: {pointsWin} pts · Draw: {pointsDraw} pt
          </span>
        </div>
      );
    }
  };

  // Filtered lists
  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
    b.session.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
    (b.slogan && b.slogan.toLowerCase().includes(batchSearchQuery.toLowerCase()))
  );

  const filteredPlayers = players.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
      p.studentId.includes(playerSearchQuery) ||
      p.email.toLowerCase().includes(playerSearchQuery.toLowerCase());
    const matchesBatch = playerBatchFilter === "ALL" || p.batchId?.toString() === playerBatchFilter;
    return matchesSearch && matchesBatch;
  });

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(tournamentSearchQuery.toLowerCase()) ||
      t.season.toLowerCase().includes(tournamentSearchQuery.toLowerCase());
    const matchesSport = tournamentSportFilter === "ALL" || t.sport === tournamentSportFilter;
    return matchesSearch && matchesSport;
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
              <span className="text-xs font-bold text-[#7C6E63] uppercase">Database</span>
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

            {/* Batch Search Filter */}
            <div className="bg-white p-3 rounded-2xl border border-[#E5DACB] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#7C6E63] ml-2" />
              <input
                type="text"
                placeholder="Search batches by Name, Session, or Slogan..."
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#2C221E] focus:outline-none"
              />
              {batchSearchQuery && (
                <button onClick={() => setBatchSearchQuery("")} className="text-xs text-[#7C6E63] mr-2">
                  Clear
                </button>
              )}
            </div>

            {/* Batch Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBatches.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-[#7C6E63]">
                  No batches found matching "{batchSearchQuery}".
                </div>
              ) : (
                filteredBatches.map((b) => (
                  <div key={b.id} className="bg-white p-5 rounded-3xl border border-[#E5DACB] shadow-xs flex flex-col justify-between space-y-4 relative group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] font-black text-sm flex items-center justify-center border border-[#E8D6C3]">
                          B{b.batchNumber}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#7C6E63] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8DCCF]">
                            Session: {b.session}
                          </span>
                          <button
                            onClick={() => handleOpenEditBatch(b)}
                            title="Edit batch"
                            className="p-1 text-[#7C6E63] hover:text-[#9E2A2B] hover:bg-[#FAF0E6] rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(b.id, b.name)}
                            title="Delete batch"
                            className="p-1 text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-base text-[#2C221E]">{b.name}</h4>
                      <p className="text-xs text-[#9E2A2B] font-semibold">{b.slogan || "Red Brick Champions"}</p>
                    </div>

                    <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5E53]">
                      <span>👥 {b.studentsCount} Students</span>
                      <span className="font-semibold text-[#842021]">🏆 {b.teamsCount} Teams</span>
                    </div>

                    {/* Batch Moderators Strip */}
                    <div className="pt-2.5 border-t border-[#EFE8DC] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#7C6E63] uppercase">Moderators ({b.moderators?.length || 0}):</span>
                        <button
                          onClick={() => handleOpenAssignBatchModModal(b.id)}
                          className="text-[#9E2A2B] hover:text-[#842021] font-bold text-[10px] bg-[#FAF0E6] hover:bg-[#F5E0D0] px-2 py-0.5 rounded-md border border-[#E8D6C3] transition-colors"
                        >
                          + Add Mod
                        </button>
                      </div>
                      {b.moderators && b.moderators.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {b.moderators.map((mod) => (
                            <span key={mod.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                              <span>🛡️ {mod.name.split(" ")[0]} ({mod.roll})</span>
                              <button
                                onClick={() => handleRemoveBatchModerator(b.id, mod.id, mod.name)}
                                className="text-[#9E2A2B] hover:text-[#6F1819] p-0.5 rounded hover:bg-[#F5E0D0]"
                                title="Remove moderator"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#7C6E63] italic">No moderator assigned</p>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                            <Link 
                              to={`/players/${player.studentId}`}
                              className="font-extrabold text-[#2C221E] hover:text-[#9E2A2B] hover:underline"
                            >
                              {player.name}
                            </Link>
                            <p className="text-[11px] text-[#7C6E63]">{player.email}</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#842021]">
                            {player.batch}
                          </td>
                          <td className="py-3.5 px-4 text-[#6B5E53]">
                            {player.cricketRole ? (
                              <>
                                <span>{player.cricketRole}</span>
                                {player.footballPosition && <span className="ml-1 text-[11px]">/ {player.footballPosition}</span>}
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-[#842021] bg-[#FAF0E6] px-2 py-0.5 rounded border border-[#E8D6C3]">
                                ⚡ Profile Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {player.isTemporaryPassword ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] bg-[#FAF0E6] text-[#842021] px-2 py-0.5 rounded border border-[#E8D6C3] font-bold">
                                  {player.temporaryPlainPassword || `CSEPL@${player.studentId}`}
                                </span>
                                <button
                                  onClick={() => {
                                    const passToCopy = player.temporaryPlainPassword || `CSEPL@${player.studentId}`;
                                    navigator.clipboard.writeText(passToCopy);
                                    triggerNotification(`Copied temp pass (${passToCopy}) for ${player.name} to clipboard!`);
                                  }}
                                  title="Copy random temp pass"
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPlayer(player)}
                                title="Edit player profile"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B5E53] hover:text-[#2C221E] bg-[#FAF7F2] hover:bg-[#EFE8DC] px-2 py-1 rounded-lg border border-[#D8C7B3] transition-colors"
                              >
                                <Pencil className="w-3 h-3 text-[#9E2A2B]" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleResetTempPass(player)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] hover:text-[#842021] bg-[#FAF0E6] hover:bg-[#F5E0D0] px-2 py-1 rounded-lg border border-[#E8D6C3] transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reset Pass</span>
                              </button>

                              <button
                                onClick={() => handleDeletePlayer(player.id, player.name, player.studentId)}
                                title="Delete player"
                                className="p-1.5 text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

            {/* Tournament Search & Sport Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-white p-3 rounded-2xl border border-[#E5DACB] flex items-center gap-3">
                <Search className="w-4 h-4 text-[#7C6E63] ml-2" />
                <input
                  type="text"
                  placeholder="Search tournaments by Title or Season..."
                  value={tournamentSearchQuery}
                  onChange={(e) => setTournamentSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#2C221E] focus:outline-none"
                />
                {tournamentSearchQuery && (
                  <button onClick={() => setTournamentSearchQuery("")} className="text-xs text-[#7C6E63] mr-2">
                    Clear
                  </button>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-2xl border border-[#E5DACB] flex items-center">
                <select
                  value={tournamentSportFilter}
                  onChange={(e) => setTournamentSportFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#2C221E] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sports ({tournaments.length})</option>
                  <option value="CRICKET">🏏 Cricket Only</option>
                  <option value="FOOTBALL">⚽ Football Only</option>
                </select>
              </div>
            </div>

            {/* Tournament Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTournaments.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-[#7C6E63]">
                  No tournaments found matching "{tournamentSearchQuery}".
                </div>
              ) : (
                filteredTournaments.map((t) => (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-xs space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                          {t.sport === "CRICKET" ? "🏏 Cricket League" : "⚽ Football Cup"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                            {t.status}
                          </span>
                          <button
                            onClick={() => handleOpenEditTournament(t)}
                            title="Edit tournament"
                            className="p-1 text-[#7C6E63] hover:text-[#9E2A2B] hover:bg-[#FAF0E6] rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTournament(t.id, t.name)}
                            title="Delete tournament"
                            className="p-1 text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[#2C221E]">{t.name}</h4>
                        <p className="text-xs text-[#7C6E63] mt-0.5">Season: {t.season} · {t.teamsCount} Teams registered</p>
                      </div>

                      {/* Formatted Format & Specifications */}
                      <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-xs space-y-1.5">
                        <p className="font-bold text-[#7C6E63] text-[10px] uppercase tracking-wider">Format & Specifications</p>
                        {renderRulesPills(t.rules, t.sport)}
                      </div>
                    </div>

                    {/* Assigned Organizers with + Add Organizer button on card */}
                    <div className="pt-3.5 border-t border-[#EFE8DC] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-[#7C6E63] uppercase">Tournament Organizers ({t.organizers.length}):</p>
                        <button
                          onClick={() => handleOpenAssignModalForTournament(t.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] hover:text-[#842021] bg-[#FAF0E6] hover:bg-[#F5E0D0] px-2.5 py-1 rounded-lg border border-[#E8D6C3] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Organizer</span>
                        </button>
                      </div>

                      {t.organizers.length === 0 ? (
                        <p className="text-xs text-[#7C6E63] italic">No student organizers assigned yet. Click "Add Organizer" above.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {t.organizers.map((org) => (
                            <span key={org.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                              <span>👤 {org.name} ({org.roll})</span>
                              <button
                                onClick={() => handleRemoveOrganizer(t.id, org.id, org.name)}
                                title="Remove organizer"
                                className="text-[#9E2A2B] hover:text-[#6F1819] p-0.5 hover:bg-[#F5E0D0] rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
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
            <h3 className="text-lg font-black text-[#2C221E] mb-1">Register Player / Student</h3>
            <p className="text-xs text-[#7C6E63] mb-4">A temporary password will be auto-generated for the student's initial sign-in.</p>
            
            <form onSubmit={handleAddPlayer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">
                  Student ID / Roll <span className="text-[#9E2A2B]">*</span>
                </label>
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
                <label className="block font-bold text-[#4A3E35] mb-1">
                  Full Name <span className="text-[#9E2A2B]">*</span>
                </label>
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
                <label className="block font-bold text-[#4A3E35] mb-1">
                  Batch Assignment <span className="text-[#9E2A2B]">*</span>
                </label>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#4A3E35]">Email Address</label>
                  <span className="text-[10px] text-[#7C6E63] font-semibold">Optional</span>
                </div>
                <input
                  type="email"
                  placeholder={newPlayerRoll ? `${newPlayerRoll}@cse.cu.ac.bd (Default)` : "e.g. 20701055@cse.cu.ac.bd"}
                  value={newPlayerEmail}
                  onChange={(e) => setNewPlayerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              {/* Note on Player Profile Setup */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] text-[11px] text-[#6B5E53] leading-relaxed">
                <span className="font-bold text-[#2C221E]">ℹ️ Player Profile:</span> Sports roles (Cricket style, Football position, Jersey number) will be set directly by the student upon logging in.
              </div>

              <div className="p-2.5 bg-[#FAF0E6] rounded-xl border border-[#E8D6C3] text-[11px] text-[#842021]">
                <strong>🔐 Random Temp Pass:</strong> <span className="text-[#6B5E53] ml-1">A secure 6-character random password (e.g. <code className="font-mono bg-white px-1.5 py-0.5 rounded font-bold text-[#842021]">CSEPL@7K9M2P</code>) will be generated and ready to copy.</span>
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
                  <option value="CRICKET">🏏 Cricket League</option>
                  <option value="FOOTBALL">⚽ Football / Futsal Cup</option>
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

              {/* Dynamic Rule Specification Inputs */}
              {newTournamentSport === "CRICKET" ? (
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF]">
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Overs Per Innings</label>
                    <input
                      type="number"
                      value={newTournamentOvers}
                      onChange={(e) => setNewTournamentOvers(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Max Overs / Bowler</label>
                    <input
                      type="number"
                      value={newTournamentBowlerMax}
                      onChange={(e) => setNewTournamentBowlerMax(e.target.value)}
                      placeholder="2"
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF]">
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Half Duration (Mins)</label>
                    <input
                      type="number"
                      value={newTournamentHalfMins}
                      onChange={(e) => setNewTournamentHalfMins(e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Squad Format</label>
                    <input
                      type="text"
                      value={newTournamentFormatText}
                      onChange={(e) => setNewTournamentFormatText(e.target.value)}
                      placeholder="7-a-side"
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                    />
                  </div>
                </div>
              )}

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

      {/* EDIT BATCH MODAL */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setEditingBatch(null)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2C221E]">Edit Academic Batch</h3>
                <p className="text-xs text-[#7C6E63]">Update batch title, academic session, crest, or slogan</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveEditBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Display Name <span className="text-[#9E2A2B]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24th Batch"
                  value={editingBatch.name}
                  onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Session <span className="text-[#9E2A2B]">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2019-2020"
                    value={editingBatch.session}
                    onChange={(e) => setEditingBatch({ ...editingBatch, session: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Batch Number <span className="text-[#9E2A2B]">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="24"
                    value={editingBatch.batchNumber}
                    onChange={(e) => setEditingBatch({ ...editingBatch, batchNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Batch Slogan / Motto</label>
                <input
                  type="text"
                  placeholder="e.g. The Red Brick Champions"
                  value={editingBatch.slogan}
                  onChange={(e) => setEditingBatch({ ...editingBatch, slogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Crest / Avatar Image URL</label>
                <input
                  type="text"
                  placeholder="https://... or leave blank"
                  value={editingBatch.avatarUrl}
                  onChange={(e) => setEditingBatch({ ...editingBatch, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Class Photo / Banner URL</label>
                <input
                  type="text"
                  placeholder="https://... or leave blank"
                  value={editingBatch.bannerUrl}
                  onChange={(e) => setEditingBatch({ ...editingBatch, bannerUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingBatch(null)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingPlayer(null)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2C221E]">Edit Player Profile</h3>
                <p className="text-xs text-[#7C6E63]">Update student credentials, department batch, and playing roles</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveEditPlayer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Student ID / Roll <span className="text-[#9E2A2B]">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20701045"
                    value={editingPlayer.studentId}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, studentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-mono focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Full Name <span className="text-[#9E2A2B]">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanzid Rahman"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. 20701045@cse.cu.ac.bd"
                  value={editingPlayer.email}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Batch Assignment</label>
                  <select
                    value={editingPlayer.batchId || ""}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, batchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="">-- Unassigned --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.session})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">System Role</label>
                  <select
                    value={editingPlayer.role}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value as "USER" | "ADMIN" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-bold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="USER">Standard Player (USER)</option>
                    <option value="ADMIN">Super Admin (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Cricket Role</label>
                  <select
                    value={editingPlayer.cricketRole || ""}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, cricketRole: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="">-- Not Specified --</option>
                    <option value="Top-order Batter">🏏 Top-order Batter</option>
                    <option value="Middle-order Batter">🏏 Middle-order Batter</option>
                    <option value="Wicketkeeper Batter">🧤 Wicketkeeper Batter</option>
                    <option value="All-Rounder">⚡ All-Rounder</option>
                    <option value="Fast Bowler">🎯 Fast Bowler</option>
                    <option value="Spin Bowler">🌀 Spin Bowler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Football Position</label>
                  <select
                    value={editingPlayer.footballPosition || ""}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, footballPosition: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="">-- Not Specified --</option>
                    <option value="Goalkeeper">🧤 Goalkeeper</option>
                    <option value="Defender">🛡️ Defender</option>
                    <option value="Midfielder">🧠 Midfielder</option>
                    <option value="Winger">⚡ Winger</option>
                    <option value="Forward / Striker">🎯 Forward / Striker</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingPlayer(null)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TOURNAMENT MODAL */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingTournament(null)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2C221E]">Edit Tournament Configuration</h3>
                <p className="text-xs text-[#7C6E63]">Update title, status, sport rules, and branding visuals</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveEditTournament} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Tournament Title <span className="text-[#9E2A2B]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Premier League 2026"
                  value={editingTournament.name}
                  onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Sport</label>
                  <select
                    value={editingTournament.sport}
                    onChange={(e) => setEditingTournament({ ...editingTournament, sport: e.target.value as "CRICKET" | "FOOTBALL" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-bold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="CRICKET">🏏 Cricket</option>
                    <option value="FOOTBALL">⚽ Football</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Season</label>
                  <input
                    type="text"
                    value={editingTournament.season}
                    onChange={(e) => setEditingTournament({ ...editingTournament, season: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Status</label>
                  <select
                    value={editingTournament.status}
                    onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-bold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Sport Rules */}
              {editingTournament.sport === "CRICKET" ? (
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] space-y-2.5">
                  <p className="font-bold text-[#7C6E63] text-[10px] uppercase tracking-wider">🏏 Cricket Specifications</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Overs / Side</label>
                      <input
                        type="number"
                        value={editingTournament.overs}
                        onChange={(e) => setEditingTournament({ ...editingTournament, overs: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Max / Bowler</label>
                      <input
                        type="number"
                        value={editingTournament.maxPerBowler}
                        onChange={(e) => setEditingTournament({ ...editingTournament, maxPerBowler: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Powerplay Ov</label>
                      <input
                        type="number"
                        value={editingTournament.powerplay}
                        onChange={(e) => setEditingTournament({ ...editingTournament, powerplay: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EFE8DC]">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Points for Win</label>
                      <input
                        type="number"
                        value={editingTournament.pointsWin}
                        onChange={(e) => setEditingTournament({ ...editingTournament, pointsWin: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Points for Tie/NR</label>
                      <input
                        type="number"
                        value={editingTournament.pointsTieDraw}
                        onChange={(e) => setEditingTournament({ ...editingTournament, pointsTieDraw: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] space-y-2.5">
                  <p className="font-bold text-[#7C6E63] text-[10px] uppercase tracking-wider">⚽ Football Specifications</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Format</label>
                      <input
                        type="text"
                        placeholder="7-a-side"
                        value={editingTournament.format}
                        onChange={(e) => setEditingTournament({ ...editingTournament, format: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Half Duration (mins)</label>
                      <input
                        type="number"
                        value={editingTournament.halfMinutes}
                        onChange={(e) => setEditingTournament({ ...editingTournament, halfMinutes: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EFE8DC]">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Points for Win</label>
                      <input
                        type="number"
                        value={editingTournament.pointsWin}
                        onChange={(e) => setEditingTournament({ ...editingTournament, pointsWin: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3E35] mb-0.5">Points for Draw</label>
                      <input
                        type="number"
                        value={editingTournament.pointsTieDraw}
                        onChange={(e) => setEditingTournament({ ...editingTournament, pointsTieDraw: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-white text-[#2C221E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Logo / Crest URL</label>
                  <input
                    type="text"
                    placeholder="https://... or leave blank"
                    value={editingTournament.logoUrl}
                    onChange={(e) => setEditingTournament({ ...editingTournament, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Banner / Cover URL</label>
                  <input
                    type="text"
                    placeholder="https://... or leave blank"
                    value={editingTournament.bannerUrl}
                    onChange={(e) => setEditingTournament({ ...editingTournament, bannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingTournament(null)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN BATCH MODERATOR MODAL */}
      {showAssignBatchModModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAssignBatchModModal(false)} className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E]">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2C221E]">Assign Batch Moderator</h3>
                <p className="text-xs text-[#7C6E63]">Grant batch photo, banner, and slogan curation permissions</p>
              </div>
            </div>
            
            <form onSubmit={handleAssignBatchModerator} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Target Batch</label>
                <select
                  value={selectedBatchForMod || ""}
                  onChange={(e) => {
                    const bId = Number(e.target.value);
                    setSelectedBatchForMod(bId);
                    const batchStudents = players.filter(p => p.batchId === bId);
                    if (batchStudents.length > 0) {
                      setSelectedUserForMod(batchStudents[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.session})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Select Student / Class Representative</label>
                <select
                  value={selectedUserForMod || ""}
                  onChange={(e) => setSelectedUserForMod(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                >
                  {(selectedBatchForMod 
                    ? players.filter(p => p.batchId === selectedBatchForMod)
                    : players
                  ).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Roll: {p.studentId})
                    </option>
                  ))}
                </select>
                {selectedBatchForMod && players.filter(p => p.batchId === selectedBatchForMod).length === 0 && (
                  <p className="text-[11px] text-[#C92A2A] mt-1">No registered students found for this batch yet.</p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAssignBatchModModal(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold rounded-xl text-xs">
                  Grant Moderator Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
