import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { LiveMatchCards } from "@/components/home/LiveMatchCards";
import { TournamentsSection } from "@/components/home/TournamentsSection";
import { BatchHallOfFameTeaser } from "@/components/home/BatchHallOfFameTeaser";
import { TopPerformersSection } from "@/components/home/TopPerformersSection";

export const HomePage: React.FC = () => {
  const [activeSport, setActiveSport] = useState<"cricket" | "football">("cricket");
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace("#", "");
      const targetElement = document.getElementById(elementId);
      if (targetElement) {
        // Small delay to ensure children layout is mounted
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C221E]">
      <Navbar activeSport={activeSport} onSelectSport={setActiveSport} />
      <main className="flex-1">
        <HeroSection activeSport={activeSport} onSelectSport={setActiveSport} />
        <div id="matches" className="scroll-mt-20">
          <LiveMatchCards activeSport={activeSport} />
        </div>
        <div id="tournaments" className="scroll-mt-20">
          <TournamentsSection />
        </div>
        <div id="batches" className="scroll-mt-20">
          <BatchHallOfFameTeaser />
        </div>
        <div id="hall-of-fame" className="scroll-mt-20">
          <TopPerformersSection activeSport={activeSport} />
        </div>
      </main>
      <Footer />
    </div>
  );
};
