import React from "react";
import { Link } from "react-router-dom";
import { Award, Trophy } from "lucide-react";
import { DummyBadge } from "@/components/common/DummyBadge";

export const BatchHallOfFameTeaser: React.FC = () => {
  const batches = [
    {
      id: 20,
      name: "20th Batch",
      slogan: "The Invincible Titans",
      session: "2018-19",
      trophies: 4,
      cricketTitles: 3,
      footballTitles: 1,
      played: 28,
      won: 22,
      winRate: "78.5%",
      avatarColor: "bg-[#9E2A2B]",
      tag: "All-Time #1",
    },
    {
      id: 21,
      name: "21st Batch",
      slogan: "The Red Brick Warriors",
      session: "2019-20",
      trophies: 3,
      cricketTitles: 1,
      footballTitles: 2,
      played: 24,
      won: 18,
      winRate: "75.0%",
      avatarColor: "bg-[#842021]",
      tag: "Futsal Champs",
    },
    {
      id: 19,
      name: "19th Batch",
      slogan: "The Legacy Pioneers",
      session: "2017-18",
      trophies: 3,
      cricketTitles: 2,
      footballTitles: 1,
      played: 26,
      won: 17,
      winRate: "65.3%",
      avatarColor: "bg-[#2C221E]",
      tag: "Senior Legends",
    },
    {
      id: 22,
      name: "22nd Batch",
      slogan: "The Rising Royals",
      session: "2020-21",
      trophies: 1,
      cricketTitles: 0,
      footballTitles: 1,
      played: 18,
      won: 12,
      winRate: "66.6%",
      avatarColor: "bg-[#D96B27]",
      tag: "Defending Futsal",
    },
  ];

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B] mb-1">
              <Award className="w-4 h-4" />
              <span>Department Records</span>
              <DummyBadge label="HISTORICAL PREVIEW DATA" variant="warning" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
              Batch Hall of Fame & Rivalries
            </h2>
          </div>

          <p className="text-xs text-[#6B5E53] max-w-sm">
            All tournament wins, championships, and batch head-to-head match histories are permanently recorded.
          </p>
        </div>

        {/* Batches Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              to={`/batches/batch-${batch.id}`}
              className="bg-white rounded-3xl border border-[#E5DACB] p-5 shadow-xs hover:shadow-md hover:border-[#9E2A2B]/70 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl ${batch.avatarColor} text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform`}>
                    B{batch.id}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                    {batch.tag}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors">{batch.name}</h3>
                <p className="text-xs font-semibold text-[#9E2A2B]">{batch.slogan}</p>
                <p className="text-[11px] text-[#7C6E63] mt-0.5">Session: {batch.session}</p>

                {/* Trophy Showcase */}
                <div className="my-4 p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E]">
                    <Trophy className="w-4 h-4 text-[#D96B27]" />
                    <span>{batch.trophies} Titles</span>
                  </div>
                  <div className="text-[11px] text-[#6B5E53] font-medium">
                    🏏 {batch.cricketTitles} · ⚽ {batch.footballTitles}
                  </div>
                </div>
              </div>

              {/* Match Win Statistics */}
              <div className="pt-3 border-t border-[#EFE8DC] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B5E53] font-medium">
                  <span>Match Record</span>
                  <span className="font-bold text-[#2C221E]">{batch.won}W - {batch.played - batch.won}L</span>
                </div>
                <div className="flex justify-between text-[#6B5E53] font-medium">
                  <span>Win Rate</span>
                  <span className="font-black text-[#2A7B54]">{batch.winRate}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
