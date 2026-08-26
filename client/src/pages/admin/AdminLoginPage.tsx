import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowLeft, Sparkles, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.adminLogin(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@cse.cu.ac.bd");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Top Header Link */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors p-2 rounded-xl hover:bg-[#F0E8DC]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CSEPL Public Website</span>
        </Link>
        <span className="text-[11px] font-bold text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E5DACB]">
          Authorized Personnel Only
        </span>
      </div>

      {/* Centered Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xl shadow-[#9E2A2B]/5 relative overflow-hidden">
          
          {/* Top Decorative Brick Accent */}
          <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

          {/* Department Branding */}
          <div className="text-center space-y-3 mb-8 pt-2">
            <div className="w-14 h-14 rounded-2xl brick-gradient text-white flex items-center justify-center mx-auto shadow-md shadow-[#9E2A2B]/20 border border-[#842021]">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#2C221E] tracking-tight">
                Department Admin Portal
              </h1>
              <p className="text-xs text-[#7C6E63] font-medium mt-1">
                Dept. of Computer Science & Engineering, CU
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success ? (
            <div className="p-6 rounded-2xl bg-[#E6FCF5] border border-[#20C997] text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#0CA678] mx-auto animate-bounce" />
              <p className="font-bold text-sm text-[#0CA678]">Admin Authentication Verified!</p>
              <p className="text-xs text-[#6B5E53]">Redirecting to Department Admin Dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E35] mb-1.5">
                  Department Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="admin@cse.cu.ac.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E35] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7C6E63] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-[#2C221E] text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]"
                  />
                </div>
              </div>

              {/* Demo Helper Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF0E6] hover:bg-[#F5E6D8] border border-[#E5DACB] text-[11px] font-bold text-[#842021] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  <span>Use Demo Admin Credentials (admin@cse.cu.ac.bd)</span>
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-sm h-11 rounded-xl shadow-md shadow-[#9E2A2B]/20 transition-all"
                >
                  {loading ? "Authenticating..." : "Sign In to Admin Dashboard"}
                </Button>
              </div>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="mt-6 pt-5 border-t border-[#EFE8DC] text-center">
            <p className="text-[11px] text-[#7C6E63] flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>University of Chittagong · Red Brick Campus</span>
            </p>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#7C6E63] py-2">
        © {new Date().getFullYear()} CSE Department, University of Chittagong. All rights reserved.
      </div>

    </div>
  );
};
