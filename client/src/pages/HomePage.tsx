import React, { useState } from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { LiveMatchCards } from "@/components/home/LiveMatchCards";
import { TournamentsSection } from "@/components/home/TournamentsSection";
import { BatchHallOfFameTeaser } from "@/components/home/BatchHallOfFameTeaser";
import { TopPerformersSection } from "@/components/home/TopPerformersSection";

export const HomePage: React.FC = () => {
  const [activeSport, setActiveSport] = useState<"cricket" | "football">("cricket");

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C221E]">
      <Navbar activeSport={activeSport} onSelectSport={setActiveSport} />
      <main className="flex-1">
        <HeroSection activeSport={activeSport} onSelectSport={setActiveSport} />
        <LiveMatchCards activeSport={activeSport} />
        <TournamentsSection />
        <BatchHallOfFameTeaser />
        <TopPerformersSection activeSport={activeSport} />
      </main>
      <Footer />
    </div>
  );
};
