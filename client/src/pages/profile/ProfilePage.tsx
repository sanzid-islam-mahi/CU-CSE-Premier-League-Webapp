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
  ArrowLeft,
  Camera,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "@/context/ToastContext";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { ImageUploadModal } from "@/components/common/ImageUploadModal";
import { MediaGalleryView } from "@/components/common/MediaGalleryView";
import { BatchChip } from "@/components/common/BatchChip";

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
  const [coverUrl, setCoverUrl] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [cricketRole, setCricketRole] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [footballPosition, setFootballPosition] = useState("");
  const [preferredJerseyNo, setPreferredJerseyNo] = useState<number | string>("");

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
      setCoverUrl(data.coverUrl || "");
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

  const handleUpdateAvatar = async (url: string) => {
    try {
      setAvatarUrl(url);
      const res = await api.auth.updateProfile({ avatarUrl: url });
      setUser(res.user);
      toast.success("Profile photo updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile photo.");
    }
  };

  const handleUpdateCover = async (url: string) => {
    try {
      setCoverUrl(url);
      const res = await api.auth.updateProfile({ coverUrl: url });
      setUser(res.user);
      toast.success("Cover photo updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update cover photo.");
    }
  };

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
        coverUrl: coverUrl || null,
        cricketRole: cricketRole || null,
        battingStyle: battingStyle || null,
        bowlingStyle: bowlingStyle || null,
        footballPosition: footballPosition || null,
        preferredJerseyNo: preferredJerseyNo !== "" ? Number(preferredJerseyNo) : null,
      });
      setUser(res.user);
      setIsEditing(false);
      toast.success("Profile and sports preferences saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
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
      toast.success("Password updated successfully!");
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
          <span>Loading athlete profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C221E] pb-20">
      
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

      {/* Main Profile Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HERO CARD: Player Banner */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] shadow-sm overflow-hidden relative">
          
          {/* Top Banner Cover Photo */}
          <div className="relative h-44 sm:h-60 w-full bg-[#FAF0E6] overflow-hidden group">
            {coverUrl || user?.coverUrl ? (
              <img
                src={coverUrl || user?.coverUrl}
                alt="Profile Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#9E2A2B] via-[#842021] to-[#2C221E] flex items-center justify-center text-white/40">
                <span className="text-xs font-bold uppercase tracking-wider">CU CSE Premier League Athlete</span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            
            <button
              onClick={() => setShowCoverModal(true)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-black px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/20 shadow-md flex items-center gap-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-[#F59F00]" />
              <span>Change Cover Photo</span>
            </button>
          </div>
          
          {/* Profile Header Card Body */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
            
            {/* Top Row: Avatar & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
              
              {/* Avatar with Upload Action */}
              <div className="relative group/avatar shrink-0">
                <SmartAvatar
                  src={avatarUrl || user?.avatarUrl}
                  alt={name || user?.name || "Player"}
                  size="2xl"
                  shape="rounded"
                  className="ring-4 ring-white shadow-xl"
                />
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                  title="Change Profile Photo"
                >
                  <Upload className="w-5 h-5 text-white mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Upload</span>
                </button>
              </div>

              {/* Edit / View Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 sm:pt-0">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  className={`font-bold text-xs h-10 px-4 rounded-xl shadow-xs flex items-center gap-1.5 ${
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

            {/* Profile Info Details - Cleanly situated below cover */}
            <div className="mt-5 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                  {user?.name}
                </h1>
                <span className="font-mono text-xs font-black bg-[#FAF0E6] text-[#842021] px-2.5 py-0.5 rounded-lg border border-[#E8D6C3]">
                  Roll: {user?.studentId}
                </span>
                {user?.preferredJerseyNo && (
                  <span className="font-mono text-xs font-black bg-[#9E2A2B] text-white px-2.5 py-0.5 rounded-lg shadow-xs">
                    #{user.preferredJerseyNo}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#7C6E63] font-semibold pt-0.5">
                {user?.batch && (
                  <BatchChip
                    name={user.batch.name}
                    session={user.batch.session}
                    slug={user.batch.slug}
                    avatarUrl={user.batch.avatarUrl}
                    batchNumber={user.batch.batchNumber}
                    size="xs"
                    variant="pill"
                  />
                )}
                <span>•</span>
                <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8DCCF]">
                  <span>📧</span>
                  <span className="font-mono">{user?.email}</span>
                </span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8DCCF]">
                      <span>📞</span>
                      <span className="font-mono">{user.phone}</span>
                    </span>
                  </>
                )}
              </div>

              {user?.bio && (
                <div className="pt-2">
                  <p className="text-xs text-[#4A3E35] font-medium italic bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DCCF] max-w-2xl">
                    "{user.bio}"
                  </p>
                </div>
              )}
            </div>

            {/* RESPONSIBILITIES / BADGES BAR */}
            {user?.organizerTournaments?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#EFE8DC]">
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

        {/* PLAYER PHOTO ALBUM & MOMENTS */}
        {user?.id && (
          <div className="pt-4">
            <MediaGalleryView
              userId={user.id}
              title="My Action Photos & Tournament Moments"
              description="Upload your match action photos, batting/bowling moments, celebrations, and jersey shots."
              allowUpload={true}
            />
          </div>
        )}

      </main>

      {/* AVATAR UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSuccess={handleUpdateAvatar}
        title="Update Profile Picture"
        description="Upload a high-resolution portrait or action headshot."
        aspectRatio="square"
        currentUrl={avatarUrl || user?.avatarUrl}
      />

      {/* COVER UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSuccess={handleUpdateCover}
        title="Update Profile Cover Banner"
        description="Upload a match photo, stadium background, or team picture for your header."
        aspectRatio="banner"
        currentUrl={coverUrl || user?.coverUrl}
      />

    </div>
  );
};
