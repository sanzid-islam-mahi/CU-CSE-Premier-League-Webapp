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
  Flame 
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

  // Form states: Custom Team
  const [showCustomTeamForm, setShowCustomTeamForm] = useState(false);
  const [manualTeamName, setManualTeamName] = useState("");
  const [manualShortName, setManualShortName] = useState("");

  // Form states: Create Group
  const [newGroupName, setNewGroupName] = useState("");

  // Form states: Schedule Match
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [matchTeamAId, setMatchTeamAId] = useState<number | "">("");
  const [matchTeamBId, setMatchTeamBId] = useState<number | "">("");
  const [matchGroupId, setMatchGroupId] = useState<number | "">("");
  const [matchStage, setMatchStage] = useState("GROUP_STAGE");
  const [matchStartTime, setMatchStartTime] = useState("");
  const [matchVenue, setMatchVenue] = useState(tournament.sport === "CRICKET" ? "CU CSE Ground" : "CU Central Field");

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
      });
      triggerToast(res.message);
      setSelectedBatchId("");
      setCustomTeamName("");
      setCustomShortName("");
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
      });
      triggerToast(`Custom team "${manualTeamName}" created!`);
      setManualTeamName("");
      setManualShortName("");
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

  // 5. Create Group Handler
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

  // 6. Delete Group Handler
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

  // 7. Auto Generate Round Robin Fixtures Handler
  const handleAutoGenerateFixtures = async () => {
    if (!confirm("This will automatically generate round-robin match fixtures for all groups in this tournament. Proceed?")) return;
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

  // 8. Manual Schedule Match Handler
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

  // 9. Delete Match Handler
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

  // 10. Assign Scorer Handler
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
                Manage teams, 1-click batch imports, groups, captains, fixtures and match scorers.
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

        {/* TAB 1: TEAMS & SQUADS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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

                <form onSubmit={handleImportBatch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
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
                      <option value="">-- Choose Academic Batch --</option>
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
                    <label className="block font-bold text-[#4A3E35] mb-1">Short Code (Max 6)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. DW22"
                      value={customShortName}
                      onChange={(e) => setCustomShortName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={!selectedBatchId || loading}
                      className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Import Batch Roster</span>
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
                  <form onSubmit={handleCreateCustomTeam} className="p-4 bg-white rounded-2xl border border-[#E5DACB] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
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

                      {/* Captain Selector */}
                      <div className="pt-2 border-t border-[#EFE8DC] text-xs">
                        <label className="block font-bold text-[#7C6E63] text-[11px] mb-1">
                          👑 Team Captain:
                        </label>
                        <select
                          value={team.captainId || ""}
                          onChange={(e) => handleSetCaptain(team.id, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                        >
                          <option value="">-- Elect Captain from Squad --</option>
                          {team.members?.map((m: any) => (
                            <option key={m.userId} value={m.userId}>
                              {m.user.name} (Roll: {m.user.studentId})
                            </option>
                          ))}
                        </select>
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
              <form onSubmit={handleCreateGroup} className="p-4 bg-[#FAF7F2] rounded-3xl border border-[#E5DACB] flex gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="e.g. Group A or Group B"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#D8C7B3] bg-white text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
                <Button
                  type="submit"
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs px-5 rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </Button>
              </form>

              {/* Groups Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournament.groups?.map((group: any) => (
                  <div key={group.id} className="bg-white rounded-2xl border border-[#E5DACB] p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                      <h4 className="font-extrabold text-sm text-[#9E2A2B] flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>{group.name}</span>
                      </h4>
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="p-1 rounded-lg text-[#7C6E63] hover:text-[#C92A2A] hover:bg-[#FFF5F5]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {group.teams?.map((t: any) => (
                        <div key={t.id} className="p-2 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] flex items-center justify-between">
                          <span className="font-bold text-[#2C221E]">{t.name}</span>
                          <span className="font-mono text-[10px] text-[#7C6E63]">{t.shortName}</span>
                        </div>
                      ))}

                      {(!group.teams || group.teams.length === 0) && (
                        <p className="text-xs text-[#7C6E63] italic py-2 text-center">
                          No teams assigned to this group yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAutoGenerateFixtures}
                    disabled={loading}
                    className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-[#9E2A2B]/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Generate Group Fixtures</span>
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

                    <div className="flex items-end">
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
                      <div className="flex items-center justify-between text-[11px] text-[#7C6E63] pb-2 border-b border-[#EFE8DC]">
                        <span className="font-bold text-[#9E2A2B]">Match #{m.matchNumber}</span>
                        <span>{m.stage?.replace("_", " ")}</span>
                        <button
                          onClick={() => handleDeleteMatch(m.id, m.matchNumber)}
                          className="p-1 rounded-lg text-[#C92A2A] hover:bg-[#FFF5F5]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between font-extrabold text-sm text-[#2C221E]">
                        <span>{m.teamA.name}</span>
                        <span className="text-xs text-[#9E2A2B] bg-[#FAF0E6] px-2 py-0.5 rounded font-mono">VS</span>
                        <span>{m.teamB.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#7C6E63] pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                          <span>{m.venue || "CU CSE Grounds"}</span>
                        </span>
                        <span className="font-bold text-[#2A7B54]">{m.status}</span>
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
    </div>
  );
};
