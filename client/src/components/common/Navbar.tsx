import React, { useState } from "react";
import { 
  Trophy, 
  User as UserIcon, 
  Sparkles, 
  Menu, 
  X, 
  Lock, 
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  activeSport: "cricket" | "football";
  onSelectSport: (sport: "cricket" | "football") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSport, onSelectSport }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState(false);
  const [studentRoll, setStudentRoll] = useState("");
  const [studentPass, setStudentPass] = useState("");
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const navItems = [
    { label: "Matches", icon: Calendar },
    { label: "Tournaments", icon: Trophy },
    { label: "Batches", icon: Layers },
    { label: "Hall of Fame", icon: Award },
    { label: "Stats", icon: BarChart3 },
  ];

  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentRoll || !studentPass) return;
    setLoginFeedback(`Welcome, Roll ${studentRoll}! (Dummy Mode: Login verified. First-time login password change simulated.)`);
    setTimeout(() => {
      setShowStudentLoginModal(false);
      setLoginFeedback(null);
      setStudentRoll("");
      setStudentPass("");
    }, 1800);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DCCF] bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Department Brand & Logo */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl brick-gradient flex items-center justify-center text-white shadow-md shadow-[#9E2A2B]/25 border border-[#842021]">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-[#2C221E] font-heading">
                    CSE<span className="text-[#9E2A2B]">PL</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20">
                    CU CSE
                  </span>
                </div>
                <p className="text-xs text-[#7C6E63] font-medium hidden sm:block">
                  Dept. of Computer Science & Engineering, CU
                </p>
              </div>
            </div>

            {/* Sport Switcher Toggle */}
            <div className="flex items-center bg-[#EDE4D6] p-1 rounded-full border border-[#DFD2BF] shadow-inner">
              <button
                type="button"
                onClick={() => onSelectSport("cricket")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeSport === "cricket"
                    ? "bg-[#9E2A2B] text-white shadow-sm shadow-[#9E2A2B]/30"
                    : "text-[#6A5D52] hover:text-[#2C221E]"
                }`}
              >
                <span>🏏</span>
                <span className="hidden md:inline">Cricket</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSport("football")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeSport === "football"
                    ? "bg-[#9E2A2B] text-white shadow-sm shadow-[#9E2A2B]/30"
                    : "text-[#6A5D52] hover:text-[#2C221E]"
                }`}
              >
                <span>⚽</span>
                <span className="hidden md:inline">Football</span>
              </button>
            </div>

            {/* Public Unlinked Navigation Menu Items */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#66584C] hover:text-[#9E2A2B] transition-colors cursor-default rounded-lg hover:bg-[#F1E8DC]"
                >
                  <item.icon className="w-4 h-4 opacity-70 text-[#9E2A2B]" />
                  {item.label}
                </span>
              ))}
            </nav>

            {/* Action Buttons: Student Sign In */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStudentLoginModal(true)}
                className="border-[#D8C7B3] text-[#6B1C1D] bg-white/80 hover:bg-[#FBEFE9] hover:text-[#9E2A2B] hover:border-[#9E2A2B] font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5 mr-1.5 text-[#9E2A2B]" />
                Player Sign In
              </Button>

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-[#6A5D52] hover:bg-[#EFE8DC]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8DCCF] bg-[#FAF7F2] px-4 pt-3 pb-5 space-y-2">
            <div className="grid grid-cols-2 gap-2 pb-2">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F3ECE2] text-[#2C221E] font-medium text-xs cursor-default"
                >
                  <item.icon className="w-4 h-4 text-[#9E2A2B]" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#E8DCCF]">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowStudentLoginModal(true);
                }}
                className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-semibold h-10 rounded-xl"
              >
                Player Login (Roll & Password)
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Student / Player Login Mock Dialog */}
      {showStudentLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DACB] rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowStudentLoginModal(false)}
              className="absolute top-4 right-4 text-[#7C6E63] hover:text-[#2C221E] p-1 rounded-lg hover:bg-[#F3ECE2]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FBEFE9] text-[#9E2A2B] flex items-center justify-center border border-[#9E2A2B]/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C221E]">Player & Student Sign In</h3>
                <p className="text-xs text-[#7C6E63]">Department of CSE, University of Chittagong</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCCF] text-xs text-[#6B1C1D] flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-[#9E2A2B]" />
              <div>
                <strong className="font-semibold">Temporary Password Notice:</strong> Admin provides your initial temp pass (e.g. <code className="font-mono bg-[#EFE6D8] px-1 py-0.5 rounded">CSEPL@&lt;Roll&gt;</code>). You will reset your password on first sign-in.
              </div>
            </div>

            {loginFeedback ? (
              <div className="py-6 text-center space-y-2 text-[#2A7B54]">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
                <p className="text-sm font-semibold">{loginFeedback}</p>
              </div>
            ) : (
              <form onSubmit={handleStudentLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E35] mb-1">
                    Student ID / Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 19701042"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E35] mb-1">
                    Password / Temp Pass
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStudentRoll("20701042");
                      setStudentPass("CSEPL@20701042");
                    }}
                    className="w-1/2 border-[#D8C7B3] text-xs font-semibold h-10 rounded-xl hover:bg-[#F3ECE2]"
                  >
                    Use Sample Student
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2 bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-bold h-10 rounded-xl shadow-md shadow-[#9E2A2B]/20"
                  >
                    Sign In
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
