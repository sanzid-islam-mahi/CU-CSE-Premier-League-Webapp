import React, { useState } from "react";
import { Lock, Sparkles, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface FirstTimePasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempPasswordUsed: string;
  userName?: string;
  onSuccess: () => void;
}

export const FirstTimePasswordResetModal: React.FC<FirstTimePasswordResetModalProps> = ({
  isOpen,
  onClose,
  tempPasswordUsed,
  userName,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword(tempPasswordUsed, newPassword);
      setIsDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        navigate("/profile");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative overflow-hidden">
        
        {/* Top Decorative Brick Bar */}
        <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

        {!isDone && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isDone ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#E6FCF5] text-[#0CA678] flex items-center justify-center mx-auto border border-[#20C997] animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-[#2C221E]">Account Unlocked!</h3>
            <p className="text-xs text-[#6B5E53] max-w-xs mx-auto">
              Your temporary password has been replaced. Redirecting you to your <strong>Player Profile</strong> to set up your sports style...
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center mx-auto border border-[#E8D6C3]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#2C221E]">Set Your Permanent Password</h3>
              <p className="text-xs text-[#7C6E63]">
                Welcome {userName || "Player"}! Since this is your first time logging in, please create a new secure password.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-[#9E2A2B]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? "Updating Password..." : "Save Password & Proceed to Profile"}</span>
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
