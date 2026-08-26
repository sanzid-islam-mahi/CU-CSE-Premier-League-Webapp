import React, { useState, useEffect } from "react";
import { 
  X, 
  Layers, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  MapPin, 
  Flame,
  UserMinus,
  Pencil,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type BatchItem, type UserItem } from "@/lib/api";

interface OrganizerWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
  onRefresh: () => void;
}

export const OrganizerWorkspaceModal: React.FC<OrganizerWorkspaceModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"teams" | "groups" | "fixtures">("teams");
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [allStudents, setAllStudents] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states: Import Batch
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [customTeamName, setCustomTeamName] = useState("");
  const [customShortName, setCustomShortName] = useState("");
  const [importGroupId, setImportGroupId] = useState<number | "">("");

  // Form states: Custom Team
  const [showCustomTeamForm, setShowCustomTeamForm] = useState(false);
  const [manualTeamName, setManualTeamName] = useState("");
  const [manualShortName, setManualShortName] = useState("");
  const [customTeamGroupId, setCustomTeamGroupId] = useState<number | "">("");

  // Form states: Create Group
  const [newGroupName, setNewGroupName] = useState("");
  const [groupAddTeamMap, setGroupAddTeamMap] = useState<{ [groupId: number]: number | "" }>({});

  // Form states: Schedule Match
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [matchTeamAId, setMatchTeamAId] = useState<number | "">("");
  const [matchTeamBId, setMatchTeamBId] = useState<number | "">("");
  const [matchGroupId, setMatchGroupId] = useState<number | "">("");
  const [matchStage, setMatchStage] = useState("GROUP_STAGE");
  const [matchStartTime, setMatchStartTime] = useState("");
  const [matchVenue, setMatchVenue] = useState(tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field");

  // Form states: Edit Match
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [editMatchTeamAId, setEditMatchTeamAId] = useState<number | "">("");
  const [editMatchTeamBId, setEditMatchTeamBId] = useState<number | "">("");
  const [editMatchGroupId, setEditMatchGroupId] = useState<number | "">("");
  const [editMatchStage, setEditMatchStage] = useState("GROUP_STAGE");
  const [editMatchStartTime, setEditMatchStartTime] = useState("");
  const [editMatchVenue, setEditMatchVenue] = useState("");
  const [editMatchStatus, setEditMatchStatus] = useState("SCHEDULED");
  const [editMatchWinnerTeamId, setEditMatchWinnerTeamId] = useState<number | "">("");
  const [editMatchResultSummary, setEditMatchResultSummary] = useState("");

  // Scorer assignment state
  const [selectedScorerMatchId, setSelectedScorerMatchId] = useState<number | null>(null);
  const [selectedScorerUserId, setSelectedScorerUserId] = useState<number | "">("");

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen, tournament.id]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const [batchList, studentList] = await Promise.all([
        api.batches.getAll(),
        api.users.getAll(),
      ]);
      setBatches(batchList);
      setAllStudents(studentList);
    } catch (err: any) {
      setError("Failed to load batches and students list.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 1. Batch Import Handler
  const handleImportBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    setError(null);
    setLoading(true);
    try {
      const res = await api.tournaments.importBatch(tournament.id, {
        batchId: Number(selectedBatchId),
        teamName: customTeamName || undefined,
        shortName: customShortName || undefined,
        groupId: importGroupId !== "" ? Number(importGroupId) : undefined,
      });
      triggerToast(res.message);
      setSelectedBatchId("");
      setCustomTeamName("");
      setCustomShortName("");
      setImportGroupId("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to import batch as team.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Custom Team Creation Handler
  const handleCreateCustomTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTeamName) return;

    setError(null);
    setLoading(true);
    try {
      await api.teams.create({
        tournamentId: tournament.id,
        name: manualTeamName.trim(),
        shortName: manualShortName.trim() || undefined,
        groupId: customTeamGroupId !== "" ? Number(customTeamGroupId) : null,
      });
      triggerToast(`Custom team "${manualTeamName}" created!`);
      setManualTeamName("");
      setManualShortName("");
      setCustomTeamGroupId("");
      setShowCustomTeamForm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Team Handler
  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Are you sure you want to remove team "${teamName}" from this tournament?`)) return;
    try {
      await api.teams.delete(teamId);
      triggerToast(`Team "${teamName}" removed.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete team.");
    }
  };

  // 4. Update Captain Handler
  const handleSetCaptain = async (teamId: number, captainId: number) => {
    try {
      await api.teams.update(teamId, { captainId });
      triggerToast("Team captain updated successfully.");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update captain.");
    }
  };

  // 5. Update Team Group (Add / Move / Remove from group)
  const handleSetTeamGroup = async (teamId: number, groupId: number | null) => {
    try {
      await api.teams.update(teamId, { groupId });
      triggerToast(groupId ? "Team assigned to group!" : "Team moved to unallocated pool.");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update team group.");
    }
  };

  // 6. Create Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await api.tournaments.createGroup(tournament.id, newGroupName.trim());
      triggerToast(`Created group "${newGroupName.trim()}".`);
      setNewGroupName("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to create group.");
    }
  };

  // 7. Delete Group Handler
  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? Teams will be moved to unallocated pool.`)) return;
    try {
      await api.tournaments.deleteGroup(tournament.id, groupId);
      triggerToast(`Deleted group "${groupName}".`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete group.");
    }
  };

  // 8. Add selected team into a specific group from group card
  const handleAddTeamToGroupFromCard = async (groupId: number) => {
    const selectedTeamId = groupAddTeamMap[groupId];
    if (!selectedTeamId) return;

    try {
      await handleSetTeamGroup(Number(selectedTeamId), groupId);
      setGroupAddTeamMap(prev => ({ ...prev, [groupId]: "" }));
    } catch (err: any) {
      alert(err.message || "Failed to add team to group.");
    }
  };

  // 9. Auto Generate Round Robin Fixtures Handler
  const handleAutoGenerateFixtures = async () => {
    if (!confirm("This will regenerate group stage round-robin matches for all groups in this tournament. Existing scheduled group fixtures will be cleanly replaced. Proceed?")) return;
    setLoading(true);
    try {
      const res = await api.matches.generateRoundRobin(tournament.id);
      triggerToast(res.message);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to generate fixtures.");
    } finally {
      setLoading(false);
    }
  };

  // 10. Manual Schedule Match Handler
  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTeamAId || !matchTeamBId) return;

    if (matchTeamAId === matchTeamBId) {
      alert("A team cannot play against itself.");
      return;
    }

    setLoading(true);
    try {
      await api.matches.schedule(tournament.id, {
        teamAId: Number(matchTeamAId),
        teamBId: Number(matchTeamBId),
        groupId: matchGroupId !== "" ? Number(matchGroupId) : null,
        stage: matchStage,
        startTime: matchStartTime || null,
        venue: matchVenue || null,
      });
      triggerToast("Match scheduled successfully!");
      setShowScheduleModal(false);
      setMatchTeamAId("");
      setMatchTeamBId("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to schedule match.");
    } finally {
      setLoading(false);
    }
  };

  // 11. Open Edit Match Modal
  const openEditMatchModal = (m: any) => {
    setEditingMatch(m);
    setEditMatchTeamAId(m.teamAId || "");
    setEditMatchTeamBId(m.teamBId || "");
    setEditMatchGroupId(m.groupId || "");
    setEditMatchStage(m.stage || "GROUP_STAGE");
    setEditMatchStartTime(m.startTime ? new Date(m.startTime).toISOString().slice(0, 16) : "");
    setEditMatchVenue(m.venue || "");
    setEditMatchStatus(m.status || "SCHEDULED");
    setEditMatchWinnerTeamId(m.winnerTeamId || "");
    setEditMatchResultSummary(m.resultSummary || "");
  };

  // 12. Save Edited Match Handler
  const handleSaveEditedMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    if (editMatchTeamAId === editMatchTeamBId) {
      alert("A team cannot play against itself.");
      return;
    }

    setLoading(true);
    try {
      await api.matches.update(editingMatch.id, {
        teamAId: editMatchTeamAId !== "" ? Number(editMatchTeamAId) : undefined,
        teamBId: editMatchTeamBId !== "" ? Number(editMatchTeamBId) : undefined,
        groupId: editMatchGroupId !== "" ? Number(editMatchGroupId) : null,
        stage: editMatchStage,
        startTime: editMatchStartTime ? new Date(editMatchStartTime).toISOString() : null,
        venue: editMatchVenue || null,
        status: editMatchStatus,
        winnerTeamId: editMatchWinnerTeamId !== "" ? Number(editMatchWinnerTeamId) : null,
        resultSummary: editMatchResultSummary || null,
      });
      triggerToast(`Match #${editingMatch.matchNumber} updated successfully!`);
      setEditingMatch(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update match.");
    } finally {
      setLoading(false);
    }
  };

  // 13. Delete Match Handler
  const handleDeleteMatch = async (matchId: number, matchNum: number) => {
    if (!confirm(`Are you sure you want to delete Match #${matchNum}?`)) return;
    try {
      await api.matches.delete(matchId);
      triggerToast(`Match #${matchNum} deleted.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete match.");
    }
  };

  // 14. Clear All Scheduled Matches Handler
  const handleClearScheduledMatches = async () => {
    if (!confirm("Are you sure you want to clear all scheduled matches in this tournament? Completed/Live matches will be preserved.")) return;
    setLoading(true);
    try {
      const res = await api.matches.clearScheduled(tournament.id);
      triggerToast(res.message);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to clear scheduled matches.");
    } finally {
      setLoading(false);
    }
  };

  // 15. Assign Scorer Handler
  const handleAssignScorer = async (matchId: number) => {
    if (!selectedScorerUserId) return;
    try {
      await api.matches.assignScorer(matchId, Number(selectedScorerUserId));
      triggerToast("Scorer delegated to match.");
      setSelectedScorerMatchId(null);
      setSelectedScorerUserId("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to assign scorer.");
    }
  };

  // Available batches not yet imported into this tournament
  const importedBatchIds = new Set((tournament.teams || []).map((t: any) => t.batchId).filter(Boolean));
  const availableBatches = batches.filter(b => !importedBatchIds.has(b.id));

  // Teams without any assigned group
  const unassignedTeams = (tournament.teams || []).filter((t: any) => !t.groupId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Top Brick Gradient Header */}
        <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center border border-[#E8D6C3] shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#2C221E]">
                  Organizer Workspace: <span className="text-[#9E2A2B]">{tournament.name}</span>
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                  {tournament.sport}
                </span>
              </div>
              <p className="text-xs text-[#7C6E63]">
                Manage teams, 1-click batch imports, group distributions, captains, fixtures and match scorers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#EFE8DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#EFE8DC] bg-white">
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all ${
              activeTab === "teams"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams & Squads ({tournament.teams?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all ${
              activeTab === "groups"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Groups & Pools ({tournament.groups?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("fixtures")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all ${
              activeTab === "fixtures"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Fixtures & Schedule ({tournament.matches?.length || 0})</span>
          </button>
        </div>

        {/* Toast / Alert */}
        {notification && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-[#E6FCF5] border border-[#20C997] text-[#0CA678] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: TEAMS & SQUADS */}
          {activeTab === "teams" && (
            <div className="space-y-6">
              
              {/* Batch-to-Team 1-Click Importer Card */}
              <div className="p-5 bg-[#FAF7F2] rounded-3xl border-2 border-[#E5DACB] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#9E2A2B]" />
                    <h3 className="text-sm font-black text-[#2C221E]">
                      1-Click Batch to Team Importer
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7C6E63]">
                    Instantly imports all students of a batch into this tournament roster!
                  </span>
                </div>

                <form onSubmit={handleImportBatch} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Select Batch</label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBatchId(val === "" ? "" : Number(val));
                        const b = batches.find(x => x.id === Number(val));
                        if (b) {
                          setCustomTeamName(`${b.name} Warriors`);
                          setCustomShortName(b.batchNumber ? `B${b.batchNumber}` : b.name.slice(0, 4).toUpperCase());
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    >
                      <option value="">-- Academic Batch --</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.session})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Team Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dwimik Gladiators"
                      value={customTeamName}
                      onChange={(e) => setCustomTeamName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Short Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. DW22"
                      value={customShortName}
                      onChange={(e) => setCustomShortName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Group (Optional)</label>
                    <select
                      value={importGroupId}
                      onChange={(e) => setImportGroupId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    >
                      <option value="">-- No Group --</option>
                      {tournament.groups?.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={!selectedBatchId || loading}
                      className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Import Batch</span>
                    </Button>
                  </div>
                </form>

                {availableBatches.length === 0 && (
                  <p className="text-[11px] text-[#2A7B54] font-bold">
                    ✓ All registered academic batches are already participating in this tournament!
                  </p>
                )}
              </div>

              {/* Tournament Teams Table / Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2C221E]">
                    Participating Teams ({tournament.teams?.length || 0})
                  </h3>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomTeamForm(!showCustomTeamForm)}
                    className="border-[#D8C7B3] text-[#7C6E63] text-xs font-bold h-8 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{showCustomTeamForm ? "Close Custom Form" : "+ Custom / Faculty Team"}</span>
                  </Button>
                </div>

                {showCustomTeamForm && (
                  <form onSubmit={handleCreateCustomTeam} className="p-4 bg-white rounded-2xl border border-[#E5DACB] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in">
                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Team Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSE Faculty XI"
                        value={manualTeamName}
                        onChange={(e) => setManualTeamName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Short Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. FAC"
                        value={manualShortName}
                        onChange={(e) => setManualShortName(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Group (Optional)</label>
                      <select
                        value={customTeamGroupId}
                        onChange={(e) => setCustomTeamGroupId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      >
                        <option value="">-- No Group --</option>
                        {tournament.groups?.map((g: any) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-9 rounded-xl"
                      >
                        Create Custom Team
                      </Button>
                    </div>
                  </form>
                )}

                {/* Team List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournament.teams?.map((team: any) => (
                    <div key={team.id} className="bg-white rounded-2xl border border-[#E5DACB] p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl brick-gradient text-white flex items-center justify-center font-black text-sm">
                            {team.shortName || team.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-[#2C221E]">{team.name}</p>
                            <p className="text-[11px] text-[#7C6E63]">
                              {team.batch ? `🏛️ ${team.batch.name}` : "Custom Team"} · {team._count?.members || team.members?.length || 0} Players
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="p-1.5 rounded-lg text-[#C92A2A] hover:bg-[#FFF5F5] transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Group and Captain Controls */}
                      <div className="pt-2 border-t border-[#EFE8DC] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block font-bold text-[#7C6E63] text-[11px] mb-1">
                            🏷️ Group Allocation:
                          </label>
                          <select
                            value={team.groupId || ""}
                            onChange={(e) => handleSetTeamGroup(team.id, e.target.value === "" ? null : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                          >
                            <option value="">-- Unassigned --</option>
                            {tournament.groups?.map((g: any) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-[#7C6E63] text-[11px] mb-1">
                            👑 Team Captain:
                          </label>
                          <select
                            value={team.captainId || ""}
                            onChange={(e) => handleSetCaptain(team.id, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                          >
                            <option value="">-- Elect Captain --</option>
                            {team.members?.map((m: any) => (
                              <option key={m.userId} value={m.userId}>
                                {m.user.name} ({m.user.studentId})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GROUPS & POOLS */}
          {activeTab === "groups" && (
            <div className="space-y-6">
              
              {/* Create Group Form */}
              <form onSubmit={handleCreateGroup} className="p-4 bg-[#FAF7F2] rounded-3xl border border-[#E5DACB] flex flex-col sm:flex-row gap-3 text-xs">
                <div className="flex items-center gap-2 shrink-0">
                  <Layers className="w-4 h-4 text-[#9E2A2B]" />
                  <span className="font-bold text-[#2C221E]">Create New Group:</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Group A, Group B, Pool 1..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
                <Button
                  type="submit"
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs px-5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </Button>
              </form>

              {/* Group Cards with Team Allocator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tournament.groups?.map((group: any) => {
                  const assignedTeamIds = new Set((group.teams || []).map((t: any) => t.id));
                  const candidateTeams = (tournament.teams || []).filter((t: any) => !assignedTeamIds.has(t.id));

                  return (
                    <div key={group.id} className="bg-white rounded-3xl border-2 border-[#E5DACB] p-5 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-black text-xs border border-[#E8D6C3]">
                              {group.name.charAt(0) || "G"}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-[#9E2A2B]">{group.name}</h4>
                              <p className="text-[10px] text-[#7C6E63]">{group.teams?.length || 0} Teams allocated</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="p-1.5 rounded-lg text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] transition-colors"
                            title="Delete Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Assigned Teams List */}
                        <div className="space-y-2">
                          {group.teams?.map((t: any) => (
                            <div key={t.id} className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md brick-gradient text-white flex items-center justify-center font-bold text-[10px]">
                                  {t.shortName || t.name.slice(0, 2)}
                                </span>
                                <div>
                                  <p className="font-bold text-[#2C221E] leading-tight">{t.name}</p>
                                  <p className="text-[10px] text-[#7C6E63]">{t.batch ? t.batch.name : "Custom Team"}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleSetTeamGroup(t.id, null)}
                                className="p-1 rounded-lg text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] transition-colors"
                                title="Remove from this group"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {(!group.teams || group.teams.length === 0) && (
                            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#D8C7B3] text-center space-y-1">
                              <p className="text-xs font-bold text-[#7C6E63]">No teams in {group.name} yet.</p>
                              <p className="text-[11px] text-[#A89A8D]">Add teams below or pick from unassigned pool.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Team Dropdown inside this group */}
                      <div className="pt-3 border-t border-[#EFE8DC] space-y-1.5">
                        <label className="block text-[11px] font-bold text-[#4A3E35]">
                          + Add Team to {group.name}:
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={groupAddTeamMap[group.id] || ""}
                            onChange={(e) => setGroupAddTeamMap(prev => ({
                              ...prev,
                              [group.id]: e.target.value === "" ? "" : Number(e.target.value)
                            }))}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                          >
                            <option value="">-- Choose Team to Add --</option>
                            {candidateTeams.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.name} {t.groupId ? `(Currently in another group)` : `(Unassigned)`}
                              </option>
                            ))}
                          </select>

                          <Button
                            type="button"
                            disabled={!groupAddTeamMap[group.id]}
                            onClick={() => handleAddTeamToGroupFromCard(group.id)}
                            className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs"
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Unassigned Teams Section */}
              {unassignedTeams.length > 0 && (
                <div className="p-5 bg-[#FAF0E6] rounded-3xl border border-[#E8D6C3] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <h4 className="text-xs font-black uppercase text-[#842021] tracking-wider">
                        Unallocated Teams Pool ({unassignedTeams.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-[#6B5E53]">
                      Click a button below to quickly allocate team into a group:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {unassignedTeams.map((t: any) => (
                      <div key={t.id} className="p-3 bg-white rounded-2xl border border-[#E8D6C3] flex items-center justify-between text-xs">
                        <span className="font-bold text-[#2C221E] truncate max-w-[120px]" title={t.name}>
                          {t.name}
                        </span>

                        <div className="flex items-center gap-1">
                          {tournament.groups?.map((g: any) => (
                            <button
                              key={g.id}
                              onClick={() => handleSetTeamGroup(t.id, g.id)}
                              className="px-2 py-1 rounded-lg bg-[#FAF0E6] hover:bg-[#9E2A2B] text-[#842021] hover:text-white border border-[#E8D6C3] text-[10px] font-bold transition-colors"
                            >
                              + {g.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: FIXTURES & SCHEDULING */}
          {activeTab === "fixtures" && (
            <div className="space-y-6">
              
              {/* Generator Action Banner */}
              <div className="p-5 bg-[#FAF0E6] rounded-3xl border border-[#E8D6C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#842021] flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#9E2A2B]" />
                    <span>Automatic Round-Robin Generator</span>
                  </h3>
                  <p className="text-xs text-[#6B5E53]">
                    Generates fair, complete round-robin matchups for all participating teams in each group.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleAutoGenerateFixtures}
                    disabled={loading}
                    className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-[#9E2A2B]/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Re-Generate Group Fixtures</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScheduleModal(!showScheduleModal)}
                    className="border-[#D8C7B3] text-[#7C6E63] hover:bg-white font-bold text-xs h-10 px-4 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1 text-[#9E2A2B]" />
                    <span>Manual Match</span>
                  </Button>

                  {(tournament.matches?.length || 0) > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearScheduledMatches}
                      disabled={loading}
                      className="border-[#FFC9C9] text-[#C92A2A] hover:bg-[#FFF5F5] font-bold text-xs h-10 px-3 rounded-xl"
                      title="Clear all scheduled matches"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span>Clear All Scheduled</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Manual Schedule Form Drawer */}
              {showScheduleModal && (
                <form onSubmit={handleScheduleMatch} className="p-5 bg-white rounded-3xl border-2 border-[#E5DACB] shadow-xs space-y-4 animate-in fade-in">
                  <h4 className="text-xs font-black uppercase text-[#9E2A2B] tracking-wider">
                    Schedule a Match Fixture
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Team A (Home)</label>
                      <select
                        required
                        value={matchTeamAId}
                        onChange={(e) => setMatchTeamAId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      >
                        <option value="">-- Choose Team A --</option>
                        {tournament.teams?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Team B (Away)</label>
                      <select
                        required
                        value={matchTeamBId}
                        onChange={(e) => setMatchTeamBId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      >
                        <option value="">-- Choose Team B --</option>
                        {tournament.teams?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Stage</label>
                      <select
                        value={matchStage}
                        onChange={(e) => setMatchStage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      >
                        <option value="GROUP_STAGE">Group Stage</option>
                        <option value="QUARTER_FINAL">Quarter Final</option>
                        <option value="SEMI_FINAL">Semi Final</option>
                        <option value="FINAL">Final</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Group (Optional)</label>
                      <select
                        value={matchGroupId}
                        onChange={(e) => setMatchGroupId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      >
                        <option value="">-- No Group (General) --</option>
                        {tournament.groups?.map((g: any) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Kickoff Date & Time</label>
                      <input
                        type="datetime-local"
                        value={matchStartTime}
                        onChange={(e) => setMatchStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#4A3E35] mb-1">Match Venue</label>
                      <input
                        type="text"
                        value={matchVenue}
                        onChange={(e) => setMatchVenue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                      />
                    </div>

                    <div className="flex items-end sm:col-span-3">
                      <Button
                        type="submit"
                        className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-9 rounded-xl"
                      >
                        Add Match Fixture
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Match Fixture Cards List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#7C6E63] tracking-wider">
                  Scheduled Matches ({tournament.matches?.length || 0})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tournament.matches?.map((m: any) => (
                    <div key={m.id} className="p-4 bg-white rounded-2xl border border-[#E5DACB] shadow-xs space-y-3 text-xs">
                      
                      {/* Match Header with Match # and Actions */}
                      <div className="flex items-center justify-between text-[11px] text-[#7C6E63] pb-2 border-b border-[#EFE8DC]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#9E2A2B]">Match #{m.matchNumber}</span>
                          <span>{m.stage?.replace("_", " ")} {m.group ? `· ${m.group.name}` : ""}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditMatchModal(m)}
                            className="p-1.5 rounded-lg text-[#7C6E63] hover:text-[#9E2A2B] hover:bg-[#FAF0E6] transition-colors"
                            title="Edit Match Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(m.id, m.matchNumber)}
                            className="p-1.5 rounded-lg text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5] transition-colors"
                            title="Delete Match"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Team A vs Team B Display */}
                      <div className="flex items-center justify-between font-extrabold text-sm text-[#2C221E]">
                        <span className={m.winnerTeamId === m.teamAId ? "text-[#2A7B54]" : ""}>
                          {m.teamA.name} {m.winnerTeamId === m.teamAId && "👑"}
                        </span>
                        <span className="text-xs text-[#9E2A2B] bg-[#FAF0E6] px-2 py-0.5 rounded font-mono">VS</span>
                        <span className={m.winnerTeamId === m.teamBId ? "text-[#2A7B54]" : ""}>
                          {m.teamB.name} {m.winnerTeamId === m.teamBId && "👑"}
                        </span>
                      </div>

                      {/* Result summary if any */}
                      {m.resultSummary && (
                        <p className="text-[11px] font-bold text-[#842021] bg-[#FAF0E6] px-2.5 py-1 rounded-lg border border-[#E8D6C3]">
                          📣 {m.resultSummary}
                        </p>
                      )}

                      {/* Venue, Time & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#7C6E63] pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                          <span>{m.venue || "CU CSE Grounds"}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {m.startTime && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#4A3E35]">
                              <Clock className="w-3 h-3 text-[#9E2A2B]" />
                              <span>{new Date(m.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                          )}

                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            m.status === "LIVE" ? "bg-[#FFF5F5] text-[#C92A2A] animate-pulse border border-[#FF8787]" :
                            m.status === "COMPLETED" ? "bg-[#E6FCF5] text-[#0CA678] border border-[#20C997]" :
                            "bg-[#FAF0E6] text-[#842021]"
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </div>

                      {/* Scorer Delegation Cell */}
                      <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-[#9E2A2B]" />
                          <span className="font-semibold text-[#4A3E35]">Scorers:</span>
                          <span className="text-[#6B5E53]">
                            {m.scorers?.length > 0 ? m.scorers.map((s: any) => s.user.name).join(", ") : "None assigned"}
                          </span>
                        </div>

                        {selectedScorerMatchId === m.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={selectedScorerUserId}
                              onChange={(e) => setSelectedScorerUserId(Number(e.target.value))}
                              className="px-2 py-1 text-[10px] rounded border border-[#D8C7B3] bg-[#FAF7F2]"
                            >
                              <option value="">-- Pick Student --</option>
                              {allStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignScorer(m.id)}
                              className="px-2 py-1 bg-[#9E2A2B] text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedScorerMatchId(m.id)}
                            className="text-[10px] font-bold text-[#9E2A2B] hover:underline"
                          >
                            + Assign Scorer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* DEDICATED EDIT MATCH MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-xl flex flex-col relative overflow-hidden">
            <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

            <div className="p-4 sm:p-5 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center border border-[#E8D6C3]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2C221E]">
                    Edit Match #{editingMatch.matchNumber} Fixture
                  </h3>
                  <p className="text-[11px] text-[#7C6E63]">
                    Update teams, venue, kickoff timing, group or match status.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-xl text-[#7C6E63] hover:bg-[#EFE8DC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedMatch} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Team A */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Team A (Home)</label>
                  <select
                    required
                    value={editMatchTeamAId}
                    onChange={(e) => setEditMatchTeamAId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    {tournament.teams?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                    ))}
                  </select>
                </div>

                {/* Team B */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Team B (Away)</label>
                  <select
                    required
                    value={editMatchTeamBId}
                    onChange={(e) => setEditMatchTeamBId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    {tournament.teams?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                    ))}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Stage</label>
                  <select
                    value={editMatchStage}
                    onChange={(e) => setEditMatchStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="GROUP_STAGE">Group Stage</option>
                    <option value="ROUND_OF_16">Round of 16</option>
                    <option value="QUARTER_FINAL">Quarter Final</option>
                    <option value="SEMI_FINAL">Semi Final</option>
                    <option value="THIRD_PLACE">Third Place Playoff</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>

                {/* Group */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Group Allocation</label>
                  <select
                    value={editMatchGroupId}
                    onChange={(e) => setEditMatchGroupId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="">-- No Group (General/Knockout) --</option>
                    {tournament.groups?.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Kickoff Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editMatchStartTime}
                    onChange={(e) => setEditMatchStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Match Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. CU CSE Ground"
                    value={editMatchVenue}
                    onChange={(e) => setEditMatchVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Match Status</label>
                  <select
                    value={editMatchStatus}
                    onChange={(e) => setEditMatchStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-bold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="TOSS">TOSS</option>
                    <option value="LIVE">LIVE 🔴</option>
                    <option value="INNINGS_BREAK">INNINGS BREAK</option>
                    <option value="HALFTIME">HALFTIME</option>
                    <option value="COMPLETED">COMPLETED 🏆</option>
                    <option value="POSTPONED">POSTPONED</option>
                    <option value="ABANDONED">ABANDONED</option>
                  </select>
                </div>

                {/* Winner Team (if completed) */}
                {(editMatchStatus === "COMPLETED" || editMatchStatus === "ABANDONED") && (
                  <div>
                    <label className="block font-bold text-[#4A3E35] mb-1">Winner Team</label>
                    <select
                      value={editMatchWinnerTeamId}
                      onChange={(e) => setEditMatchWinnerTeamId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    >
                      <option value="">-- No Winner (Tied / Abandoned) --</option>
                      {tournament.teams?.filter((t: any) => t.id === editMatchTeamAId || t.id === editMatchTeamBId).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} (Winner)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Result Summary */}
              {(editMatchStatus === "COMPLETED" || editMatchStatus === "ABANDONED") && (
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Result Summary Note</label>
                  <input
                    type="text"
                    placeholder="e.g. 24th Batch won by 6 runs or Match tied"
                    value={editMatchResultSummary}
                    onChange={(e) => setEditMatchResultSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMatch(null)}
                  className="border-[#D8C7B3] text-[#7C6E63] text-xs h-9 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs h-9 px-5 rounded-xl font-bold shadow-md shadow-[#9E2A2B]/20"
                >
                  Save Changes
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
