import React from "react";
import { ShieldAlert, Trophy, Heart, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E5DACB] bg-[#F4ECE1] text-[#4A3E35] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Building Lore */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl brick-gradient flex items-center justify-center text-white shadow-md shadow-[#9E2A2B]/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-[#2C221E]">
                  CSE<span className="text-[#9E2A2B]">PL</span>
                </span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9E2A2B]/10 text-[#9E2A2B]">
                  Tournament Hub
                </span>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed text-[#6B5E53] max-w-md">
              The official tournament management & live scoring platform for the{" "}
              <strong className="text-[#2C221E]">Department of Computer Science & Engineering</strong>, 
              University of Chittagong. Powering batch rivalries, sportsmanship, and student glory.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#7C6E63]">
              <Building2 className="w-4 h-4 text-[#9E2A2B] shrink-0" />
              <span>Iconic Red Brick Academic Building, Faculty of Science, CU</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-[#7C6E63]">
              <MapPin className="w-4 h-4 text-[#9E2A2B] shrink-0" />
              <span>University of Chittagong, Hathazari, Chittagong, Bangladesh</span>
            </div>
          </div>

          {/* Quick Unlinked Menu */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C221E]">
              Tournament Sections
            </h4>
            <ul className="space-y-1.5 text-xs text-[#6B5E53]">
              <li className="hover:text-[#9E2A2B] cursor-default">🏏 Cricket T10 & T20 Leagues</li>
              <li className="hover:text-[#9E2A2B] cursor-default">⚽ CSE Futsal & Football Cup</li>
              <li className="hover:text-[#9E2A2B] cursor-default">🏛️ Batch Hall of Fame & Rivalries</li>
              <li className="hover:text-[#9E2A2B] cursor-default">📊 Player Statistics & Cap Leaders</li>
              <li className="hover:text-[#9E2A2B] cursor-default">📜 Department Archive (18th-25th Batches)</li>
            </ul>
          </div>

          {/* Administration & Security Portal */}
          <div className="space-y-3 bg-[#EAE0D1] p-4 rounded-2xl border border-[#DCCFBE]">
            <div className="flex items-center gap-2 text-[#842021]">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Department Admin
              </h4>
            </div>
            <p className="text-[11px] text-[#6B5E53] leading-relaxed">
              Batch creation, player registration with temporary pass generation, and tournament organizing delegation are managed by authorized department administrators.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-bold rounded-xl shadow-sm transition-all shadow-[#9E2A2B]/20"
            >
              <span>🔒</span> Admin Portal Login
            </Link>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E0D4C3] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7C6E63]">
          <p>
            © {new Date().getFullYear()} Department of CSE, University of Chittagong. Built for Red Brick Champions.
          </p>
          <div className="flex items-center gap-1 text-[#6B5E53]">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#9E2A2B] fill-[#9E2A2B]" />
            <span>for CU CSE Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
