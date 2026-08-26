import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Edit3, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [cricketRole, setCricketRole] = useState("🏏 Top-Order Bat");
  const [battingStyle, setBattingStyle] = useState("Right Hand Bat");
  const [bowlingStyle, setBowlingStyle] = useState("Right-arm Fast");
  const [footballPosition, setFootballPosition] = useState("⚽ Forward / Striker");
  const [preferredJerseyNo, setPreferredJerseyNo] = useState<number | "">("");

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast / Alert Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await api.auth.getMe();
      setUser(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatarUrl || "");
      setCricketRole(data.cricketRole || "🏏 Top-Order Bat");
      setBattingStyle(data.battingStyle || "Right Hand Bat");
      setBowlingStyle(data.bowlingStyle || "Right-arm Fast");
      setFootballPosition(data.footballPosition || "⚽ Forward / Striker");
      setPreferredJerseyNo(data.preferredJerseyNo !== null && data.preferredJerseyNo !== undefined ? data.preferredJerseyNo : "");
    } catch {
      // Not logged in, redirect to home
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.auth.updateProfile({
        name,
        email: email.trim(),
        phone: phone || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        cricketRole: cricketRole || null,
        battingStyle: battingStyle || null,
        bowlingStyle: bowlingStyle || null,
        footballPosition: footballPosition || null,
        preferredJerseyNo: preferredJerseyNo !== "" ? Number(preferredJerseyNo) : null,
      });
      setUser(res.user);
      setIsEditing(false);
      showToast("Profile and sports preferences saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully!");
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-[#E5DACB] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CSEPL Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
              {user?.batch ? user.batch.name : "CSE Department"}
            </span>
          </div>
        </div>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#2C221E] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#E8DCCF]/20 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#20C997] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Profile Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HERO CARD: Player Banner */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Avatar Pill */}
              <div className="w-24 h-24 rounded-3xl brick-gradient text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#9E2A2B]/20 border-2 border-[#842021] shrink-0">
                {user?.name?.charAt(0) || "P"}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                    {user?.name}
                  </h1>
                  <span className="font-mono text-xs font-black bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                    Roll: {user?.studentId}
                  </span>
                </div>

                <p className="text-xs text-[#7C6E63] font-medium flex items-center justify-center sm:justify-start gap-3">
                  <span>🏛️ {user?.batch ? `${user.batch.name} (${user.batch.session})` : "CSE CU"}</span>
                  <span>•</span>
                  <span>📧 {user?.email}</span>
                </p>

                <p className="text-xs text-[#4A3E35] font-medium italic pt-1 max-w-xl">
                  "{user?.bio || "CSE Chittagong University Premier League Athlete"}"
                </p>
              </div>
            </div>

            {/* Edit / View Toggle */}
            <div className="flex flex-col sm:flex-row gap-2 self-center sm:self-start">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className={`font-bold text-xs h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5 ${
                  isEditing 
                    ? "border-[#D8C7B3] text-[#6B5E53] hover:bg-[#FAF7F2]" 
                    : "bg-[#9E2A2B] hover:bg-[#842021] text-white"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? "Cancel Editing" : "Edit Profile & Roles"}</span>
              </Button>

              <Button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                variant="outline"
                className="border-[#D8C7B3] text-[#6B5E53] hover:bg-[#FAF7F2] font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 text-[#9E2A2B]" />
                <span>Change Password</span>
              </Button>
            </div>

          </div>

          {/* RESPONSIBILITIES / BADGES BAR */}
          {user?.organizerTournaments?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#EFE8DC]">
              <div className="p-4 bg-[#FAF0E6] rounded-2xl border border-[#E8D6C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#9E2A2B] text-white flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#842021] uppercase tracking-wider">Tournament Organizing Committee</p>
                    <p className="text-xs text-[#2C221E] font-bold">
                      You are a designated Organizer for: {user.organizerTournaments.map((t: any) => t.name).join(", ")}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-[#9E2A2B] bg-white px-3 py-1.5 rounded-xl border border-[#E8D6C3] self-start sm:self-auto">
                  Organizing Rights Active ⚡
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PASSWORD CHANGE ACCORDION */}
        {showPasswordChange && (
          <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#9E2A2B]" />
              <h3 className="text-base font-black text-[#2C221E]">Change Your Password</h3>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-[#E6FCF5] border border-[#20C997] text-[#0CA678] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Your password was successfully updated!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="sm:col-span-3 pt-1 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordChange(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs px-5 rounded-xl"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* EDIT PROFILE FORM or DISPLAY VIEW */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#2C221E]">Edit Player Profile & Sports Preferences</h2>
                <p className="text-xs text-[#7C6E63]">Update your player styles, favorite jersey number, and contact info</p>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-10 px-5 rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </Button>
            </div>

            {/* SECTION 1: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase text-[#9E2A2B] tracking-wider">1. Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 018XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    disabled
                    value={user?.studentId || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DACB] bg-[#EFE8DC]/50 text-[#7C6E63] font-mono cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#4A3E35] mb-1">Short Bio / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE Dept opening batsman and passionate forward."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Cricket Preferences */}
            <div className="space-y-4 pt-4 border-t border-[#EFE8DC]">
              <h3 className="text-xs font-extrabold uppercase text-[#9E2A2B] tracking-wider flex items-center gap-1.5">
                <span>🏏 2. Cricket Profile & Techniques</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Primary Cricket Role</label>
                  <select
                    value={cricketRole}
                    onChange={(e) => setCricketRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="🏏 Top-Order Bat">🏏 Top-Order Bat</option>
                    <option value="🏏 Middle-Order Bat">🏏 Middle-Order Bat</option>
                    <option value="🏏 All-Rounder">🏏 All-Rounder</option>
                    <option value="🏏 Fast Bowler">🏏 Fast Bowler</option>
                    <option value="🏏 Spin Bowler">🏏 Spin Bowler</option>
                    <option value="🏏 Wicketkeeper">🏏 Wicketkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Batting Style</label>
                  <select
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="Right Hand Bat">Right Hand Bat (RHB)</option>
                    <option value="Left Hand Bat">Left Hand Bat (LHB)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Bowling Technique</label>
                  <select
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="Right-arm Fast">Right-arm Fast</option>
                    <option value="Right-arm Medium">Right-arm Medium</option>
                    <option value="Right-arm Off-spin">Right-arm Off-spin</option>
                    <option value="Right-arm Leg-spin">Right-arm Leg-spin</option>
                    <option value="Left-arm Fast">Left-arm Fast</option>
                    <option value="Left-arm Orthodox Spin">Left-arm Orthodox Spin</option>
                    <option value="None">Does Not Bowl</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Football Preferences */}
            <div className="space-y-4 pt-4 border-t border-[#EFE8DC]">
              <h3 className="text-xs font-extrabold uppercase text-[#9E2A2B] tracking-wider flex items-center gap-1.5">
                <span>⚽ 3. Football Profile & Jersey</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Primary Football Position</label>
                  <select
                    value={footballPosition}
                    onChange={(e) => setFootballPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  >
                    <option value="⚽ Forward / Striker">⚽ Forward / Striker</option>
                    <option value="⚽ Winger">⚽ Winger</option>
                    <option value="⚽ Attacking Midfielder">⚽ Attacking Midfielder</option>
                    <option value="⚽ Central Midfielder">⚽ Central Midfielder</option>
                    <option value="⚽ Defensive Midfielder">⚽ Defensive Midfielder</option>
                    <option value="⚽ Fullback">⚽ Fullback</option>
                    <option value="⚽ Centerback">⚽ Centerback</option>
                    <option value="⚽ Goalkeeper">⚽ Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3E35] mb-1">Preferred Jersey Number</label>
                  <input
                    type="number"
                    placeholder="e.g. 7, 10, 18, 42"
                    value={preferredJerseyNo}
                    onChange={(e) => setPreferredJerseyNo(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="rounded-xl text-xs px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs px-6 rounded-xl shadow-md"
              >
                {saving ? "Saving Changes..." : "Save Profile"}
              </Button>
            </div>
          </form>
        ) : (
          /* DISPLAY CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: Cricket Sports Card */}
            <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏏</span>
                  <h3 className="text-base font-black text-[#2C221E]">Cricket Capabilities</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                  {user?.cricketRole || "🏏 Top-Order Bat"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Batting Style</p>
                  <p className="font-extrabold text-[#2C221E] mt-0.5">{user?.battingStyle || "Right Hand Bat"}</p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Bowling Style</p>
                  <p className="font-extrabold text-[#2C221E] mt-0.5">{user?.bowlingStyle || "Right-arm Fast"}</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF0E6]/50 rounded-2xl border border-[#E8D6C3] flex items-center justify-between text-xs">
                <span className="text-[#7C6E63] font-semibold">Match Role</span>
                <span className="font-bold text-[#9E2A2B]">{user?.cricketRole || "Specialist"}</span>
              </div>
            </div>

            {/* CARD 2: Football Sports Card */}
            <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚽</span>
                  <h3 className="text-base font-black text-[#2C221E]">Football Position</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                  {user?.footballPosition || "⚽ Forward"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Position</p>
                  <p className="font-extrabold text-[#2C221E] mt-0.5">{user?.footballPosition || "Forward / Striker"}</p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF]">
                  <p className="text-[10px] font-bold text-[#7C6E63] uppercase">Jersey #</p>
                  <p className="font-extrabold text-[#9E2A2B] mt-0.5 text-base">
                    #{user?.preferredJerseyNo !== null && user?.preferredJerseyNo !== undefined ? user.preferredJerseyNo : "10"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF0E6]/50 rounded-2xl border border-[#E8D6C3] flex items-center justify-between text-xs">
                <span className="text-[#7C6E63] font-semibold">Campus Football Affiliation</span>
                <span className="font-bold text-[#9E2A2B]">{user?.batch?.name || "CSE CU Roster"}</span>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};
