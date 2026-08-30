import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Trophy, 
  User as UserIcon, 
  Menu, 
  X, 
  Calendar,
  Layers,
  Award,
  LogOut,
  Shield,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PlayerLoginModal } from "../auth/PlayerLoginModal";

interface NavbarProps {
  activeSport: "cricket" | "football";
  onSelectSport: (sport: "cricket" | "football") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSport, onSelectSport }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Check login state on mount
  const checkAuth = async () => {
    const localUser = api.auth.getCurrentUser();
    if (localUser) {
      setCurrentUser(localUser);
      // Fetch fresh profile in background
      try {
        const fresh = await api.auth.getMe();
        setCurrentUser(fresh);
      } catch {
        // Token expired
        api.auth.logout();
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setUserDropdownOpen(false);
    navigate("/");
  };

  const navItems = [
    { label: "Matches", icon: Calendar, href: "/#matches" },
    { label: "Tournaments", icon: Trophy, href: "/tournaments" },
    { label: "Batches", icon: Layers, href: "/batches" },
    { label: "Hall of Fame", icon: Award, href: "/#hall-of-fame" },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("/#")) {
      const elementId = href.replace("/#", "");
      if (window.location.pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        window.history.pushState(null, "", href);
      } else {
        navigate(href);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E8DCCF] bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Department Brand & Logo */}
            <Link to="/" className="flex items-center gap-3.5">
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
            </Link>

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

            {/* Public Navigation Menu Items */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#66584C] hover:text-[#9E2A2B] transition-colors rounded-lg hover:bg-[#F1E8DC]"
                >
                  <item.icon className="w-4 h-4 opacity-70 text-[#9E2A2B]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Area (Signed in vs Guest) */}
            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 bg-white border border-[#D8C7B3] hover:border-[#9E2A2B] px-3 py-1.5 rounded-2xl shadow-xs transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl brick-gradient text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.name?.charAt(0) || "U"}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-black text-[#2C221E] leading-tight">
                        {currentUser.name?.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-[#7C6E63] font-mono leading-none">
                        {currentUser.studentId}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7C6E63]" />
                  </button>

                  {/* User Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5DACB] rounded-2xl shadow-xl p-2 space-y-1 z-50 animate-in fade-in duration-150">
                      <div className="px-3 py-2 border-b border-[#EFE8DC]">
                        <p className="text-xs font-extrabold text-[#2C221E]">{currentUser.name}</p>
                        <p className="text-[10px] text-[#7C6E63] font-mono">Roll: {currentUser.studentId}</p>
                        {currentUser.batch && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-[#842021] bg-[#FAF0E6] px-2 py-0.5 rounded border border-[#E8D6C3]">
                            {currentUser.batch.name || currentUser.batch}
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#2C221E] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#9E2A2B]" />
                        <span>My Profile & Sports Roles</span>
                      </Link>

                      {currentUser.role === "ADMIN" && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#842021] hover:bg-[#FAF0E6] rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#9E2A2B]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#C92A2A] hover:bg-[#FFF5F5] rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                  className="border-[#D8C7B3] text-[#6B1C1D] bg-white/80 hover:bg-[#FBEFE9] hover:text-[#9E2A2B] hover:border-[#9E2A2B] font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs"
                >
                  <UserIcon className="w-3.5 h-3.5 mr-1.5 text-[#9E2A2B]" />
                  <span>Player Sign In</span>
                </Button>
              )}

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
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F3ECE2] hover:bg-[#EFE5D7] text-[#2C221E] font-medium text-xs transition-colors"
                >
                  <item.icon className="w-4 h-4 text-[#9E2A2B]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {currentUser ? (
              <div className="pt-2 border-t border-[#E8DCCF] space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl"
                >
                  Go to My Profile ({currentUser.name})
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center py-2 text-xs font-bold text-[#C92A2A] bg-[#FFF5F5] rounded-xl border border-[#FF8787]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E8DCCF]">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-semibold h-10 rounded-xl"
                >
                  Player Sign In (Roll & Temp Pass)
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Real Player Login Modal */}
      <PlayerLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(loggedUser) => {
          setCurrentUser(loggedUser);
          setShowLoginModal(false);
          navigate("/profile");
        }}
      />
    </>
  );
};
