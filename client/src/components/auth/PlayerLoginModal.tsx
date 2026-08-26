import React, { useState } from "react";
import { User, Lock, ArrowRight, AlertCircle, X, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { FirstTimePasswordResetModal } from "./FirstTimePasswordResetModal";

interface PlayerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const PlayerLoginModal: React.FC<PlayerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First time reset modal handover state
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassUsed, setTempPassUsed] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  if (!isOpen && !showResetModal) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.auth.playerLogin(identifier.trim(), password);
      
      if (data.user?.isTemporaryPassword) {
        setLoggedInUser(data.user);
        setTempPassUsed(password);
        setShowResetModal(true);
      } else {
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Invalid Student Roll / Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (roll: string) => {
    setIdentifier(roll);
  };

  return (
    <>
      {isOpen && !showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative overflow-hidden">
            
            {/* Top Decorative Brick Bar */}
            <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#FAF7F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6 pt-1">
              <div className="w-12 h-12 rounded-2xl brick-gradient text-white flex items-center justify-center mx-auto shadow-md shadow-[#9E2A2B]/20">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[#2C221E] tracking-tight">Player / Student Sign In</h3>
              <p className="text-xs text-[#7C6E63]">
                CSE Premier League · Dept. of CSE, University of Chittagong
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Student Roll Number or Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21701001 or roll@cse.cu.ac.bd"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Password / Temporary Pass</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Your password or CSEPL@..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              {/* Demo Fill Helper */}
              <div className="pt-1">
                <p className="text-[11px] text-[#7C6E63] mb-1 font-medium">Quick Roll Select (from database seed):</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFillDemo("21701001")}
                    className="px-2 py-1 rounded-lg bg-[#FAF0E6] hover:bg-[#F5E0D0] text-[10px] font-bold text-[#842021] border border-[#E8D6C3]"
                  >
                    21701001 (Anabil 21)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo("22701001")}
                    className="px-2 py-1 rounded-lg bg-[#FAF0E6] hover:bg-[#F5E0D0] text-[10px] font-bold text-[#842021] border border-[#E8D6C3]"
                  >
                    22701001 (Dwimik 22)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo("23701001")}
                    className="px-2 py-1 rounded-lg bg-[#FAF0E6] hover:bg-[#F5E0D0] text-[10px] font-bold text-[#842021] border border-[#E8D6C3]"
                  >
                    23701001 (Adhrubo 23)
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-[#9E2A2B]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? "Signing in..." : "Sign In to Player Portal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-[#EFE8DC] text-center">
              <p className="text-[11px] text-[#7C6E63] flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>Forgot or need a temporary pass? Contact Department Admin.</span>
              </p>
            </div>

          </div>
        </div>
      )}

      {/* First Time Password Reset Handover Modal */}
      <FirstTimePasswordResetModal
        isOpen={showResetModal}
        tempPasswordUsed={tempPassUsed}
        userName={loggedInUser?.name}
        onClose={() => {
          setShowResetModal(false);
          onClose();
        }}
        onSuccess={() => {
          if (loggedInUser) {
            onSuccess({ ...loggedInUser, isTemporaryPassword: false });
          }
        }}
      />
    </>
  );
};
