import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Loader2, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { SmartAvatar } from "@/components/common/SmartAvatar";
import { BatchChip } from "@/components/common/BatchChip";

interface TopPerformersSectionProps {
  activeSport: "cricket" | "football";
}

export const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ activeSport }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await api.scoring.getOverallStats({ sport: activeSport.toUpperCase() });
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load overall leaderboard stats:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [activeSport]);

  const cricketData = stats?.cricket;
  const footballData = stats?.football;

  const orangeCapLeader = cricketData?.orangeCap?.[0];
  const purpleCapLeader = cricketData?.purpleCap?.[0];
  const maxSixesLeader = cricketData?.maxSixes?.[0];

  const goldenBootLeader = footballData?.goldenBoot?.[0];
  const playmakerLeader = footballData?.topPlaymakers?.[0];
  const goldenGloveLeader = footballData?.goldenGlove?.[0];

  const hasCricketStats = orangeCapLeader || purpleCapLeader || maxSixesLeader;
  const hasFootballStats = goldenBootLeader || playmakerLeader || goldenGloveLeader;
  const hasStats = activeSport === "cricket" ? hasCricketStats : hasFootballStats;

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B] mb-1">
              <Zap className="w-4 h-4" />
              <span>Department Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
              {activeSport === "cricket" ? "Orange & Purple Cap Leaders" : "Golden Boot & Playmaker Leaders"}
            </h2>
          </div>
          <span className="text-xs text-[#7C6E63] font-semibold hidden sm:inline-block">
            Auto-synced from live scored tournament matches
          </span>
        </div>

        {loading ? (
          <div className="p-12 bg-white rounded-3xl border border-[#E5DACB] text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#9E2A2B] animate-spin" />
            <p className="text-sm font-semibold text-[#7C6E63]">Calculating tournament leaders...</p>
          </div>
        ) : !hasStats ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#E5DACB] p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center text-2xl mx-auto border border-[#E8D6C3]">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2C221E]">No Tournament Match Stats Yet</h3>
              <p className="text-sm text-[#7C6E63] max-w-md mx-auto mt-1">
                Leaderboards will automatically calculate and update in real-time as official scorers log match deliveries and goals.
              </p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white font-bold text-sm shadow-sm transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>View Tournament Fixtures</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Cricket Leaders */}
            {activeSport === "cricket" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Orange Cap (Most Runs) */}
                <div className="bg-gradient-to-br from-[#FFF5EC] to-white rounded-3xl border-2 border-[#D96B27]/40 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#D96B27] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        🧢 ORANGE CAP
                      </span>
                      <span className="text-xs font-bold text-[#D96B27]">Most Runs</span>
                    </div>

                    {orangeCapLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${orangeCapLeader.player?.studentId || orangeCapLeader.player?.id}`}>
                          <SmartAvatar
                            src={orangeCapLeader.player?.avatarUrl}
                            alt={orangeCapLeader.player?.name}
                            fallbackText={orangeCapLeader.player?.name || "SR"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#D96B27]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${orangeCapLeader.player?.studentId || orangeCapLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#D96B27] transition-colors truncate block"
                          >
                            {orangeCapLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {orangeCapLeader.player?.batch && (
                              <BatchChip
                                name={orangeCapLeader.player.batch.name}
                                session={orangeCapLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">
                              {orangeCapLeader.player?.cricketRole || "Batter"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No batting records yet</p>
                    )}
                  </div>

                  {orangeCapLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#D96B27]">{orangeCapLeader.runs}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Total Runs ({orangeCapLeader.innings} Inngs)</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">HS: <strong className="text-[#D96B27]">{orangeCapLeader.highestScore}</strong></p>
                        <p className="font-semibold text-[#2C221E]">SR: <strong className="text-[#D96B27]">{orangeCapLeader.strikeRate}</strong></p>
                        <p className="text-[11px] text-[#7C6E63]">{orangeCapLeader.fours}x4, {orangeCapLeader.sixes}x6</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purple Cap (Most Wickets) */}
                <div className="bg-gradient-to-br from-[#FAF0FF] to-white rounded-3xl border-2 border-[#6B4E71]/40 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#6B4E71] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        🧢 PURPLE CAP
                      </span>
                      <span className="text-xs font-bold text-[#6B4E71]">Most Wickets</span>
                    </div>

                    {purpleCapLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${purpleCapLeader.player?.studentId || purpleCapLeader.player?.id}`}>
                          <SmartAvatar
                            src={purpleCapLeader.player?.avatarUrl}
                            alt={purpleCapLeader.player?.name}
                            fallbackText={purpleCapLeader.player?.name || "FA"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#6B4E71]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${purpleCapLeader.player?.studentId || purpleCapLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#6B4E71] transition-colors truncate block"
                          >
                            {purpleCapLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {purpleCapLeader.player?.batch && (
                              <BatchChip
                                name={purpleCapLeader.player.batch.name}
                                session={purpleCapLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">
                              {purpleCapLeader.player?.bowlingStyle || "Bowler"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No bowling records yet</p>
                    )}
                  </div>

                  {purpleCapLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#6B4E71]">{purpleCapLeader.wickets}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Wickets ({purpleCapLeader.overs} Overs)</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">BBI: <strong className="text-[#6B4E71]">{purpleCapLeader.bestFigures}</strong></p>
                        <p className="font-semibold text-[#2C221E]">Econ: <strong className="text-[#6B4E71]">{purpleCapLeader.economy}</strong></p>
                        <p className="text-[11px] text-[#7C6E63]">Runs: {purpleCapLeader.runs}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Maximum Sixes Trophy */}
                <div className="bg-gradient-to-br from-[#FAF0E6] to-white rounded-3xl border-2 border-[#9E2A2B]/30 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#9E2A2B] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        💥 MAXIMUM SIXES
                      </span>
                      <span className="text-xs font-bold text-[#9E2A2B]">Power Striker</span>
                    </div>

                    {maxSixesLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${maxSixesLeader.player?.studentId || maxSixesLeader.player?.id}`}>
                          <SmartAvatar
                            src={maxSixesLeader.player?.avatarUrl}
                            alt={maxSixesLeader.player?.name}
                            fallbackText={maxSixesLeader.player?.name || "TH"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#9E2A2B]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${maxSixesLeader.player?.studentId || maxSixesLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#9E2A2B] transition-colors truncate block"
                          >
                            {maxSixesLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {maxSixesLeader.player?.batch && (
                              <BatchChip
                                name={maxSixesLeader.player.batch.name}
                                session={maxSixesLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">
                              {maxSixesLeader.player?.cricketRole || "Power Hitter"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No sixes recorded yet</p>
                    )}
                  </div>

                  {maxSixesLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#9E2A2B]">{maxSixesLeader.sixes}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Total Sixes Hit</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">Strike Rate: <strong className="text-[#9E2A2B]">{maxSixesLeader.strikeRate}</strong></p>
                        <p className="text-[11px] text-[#7C6E63]">4s: {maxSixesLeader.fours}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Football Leaders */}
            {activeSport === "football" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Golden Boot (Top Scorer) */}
                <div className="bg-gradient-to-br from-[#FFF9DB] to-white rounded-3xl border-2 border-[#F59F00]/50 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#F59F00] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        👟 GOLDEN BOOT
                      </span>
                      <span className="text-xs font-bold text-[#D97706]">Top Scorer</span>
                    </div>

                    {goldenBootLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${goldenBootLeader.player?.studentId || goldenBootLeader.player?.id}`}>
                          <SmartAvatar
                            src={goldenBootLeader.player?.avatarUrl}
                            alt={goldenBootLeader.player?.name}
                            fallbackText={goldenBootLeader.player?.name || "RK"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#F59F00]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${goldenBootLeader.player?.studentId || goldenBootLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#D97706] transition-colors truncate block"
                          >
                            {goldenBootLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {goldenBootLeader.player?.batch && (
                              <BatchChip
                                name={goldenBootLeader.player.batch.name}
                                session={goldenBootLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">
                              {goldenBootLeader.player?.footballPosition || "Forward"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No goals scored yet</p>
                    )}
                  </div>

                  {goldenBootLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#D97706]">{goldenBootLeader.goals}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Tournament Goals</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">Top Striker</p>
                        <p className="text-[11px] text-[#7C6E63]">CSEPL Golden Boot Race</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Playmaker (Assists) */}
                <div className="bg-gradient-to-br from-[#E6FCF5] to-white rounded-3xl border-2 border-[#20C997]/40 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#20C997] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        🎯 TOP PLAYMAKER
                      </span>
                      <span className="text-xs font-bold text-[#0CA678]">Most Assists</span>
                    </div>

                    {playmakerLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${playmakerLeader.player?.studentId || playmakerLeader.player?.id}`}>
                          <SmartAvatar
                            src={playmakerLeader.player?.avatarUrl}
                            alt={playmakerLeader.player?.name}
                            fallbackText={playmakerLeader.player?.name || "SI"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#20C997]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${playmakerLeader.player?.studentId || playmakerLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#0CA678] transition-colors truncate block"
                          >
                            {playmakerLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {playmakerLeader.player?.batch && (
                              <BatchChip
                                name={playmakerLeader.player.batch.name}
                                session={playmakerLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">
                              {playmakerLeader.player?.footballPosition || "Midfielder"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No assists recorded yet</p>
                    )}
                  </div>

                  {playmakerLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#0CA678]">{playmakerLeader.assists}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Assists Provided</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">Playmaker Maestro</p>
                        <p className="text-[11px] text-[#7C6E63]">Key passes & goal setups</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Golden Glove (Clean Sheets) */}
                <div className="bg-gradient-to-br from-[#E7F5FF] to-white rounded-3xl border-2 border-[#339AF0]/40 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#339AF0] text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                        🧤 GOLDEN GLOVE
                      </span>
                      <span className="text-xs font-bold text-[#1C7ED6]">Best Goalkeeper</span>
                    </div>

                    {goldenGloveLeader ? (
                      <div className="flex items-center gap-3 my-3">
                        <Link to={`/players/${goldenGloveLeader.player?.studentId || goldenGloveLeader.player?.id}`}>
                          <SmartAvatar
                            src={goldenGloveLeader.player?.avatarUrl}
                            alt={goldenGloveLeader.player?.name}
                            fallbackText={goldenGloveLeader.player?.name || "NC"}
                            size="lg"
                            shape="circle"
                            className="ring-2 ring-[#339AF0]/30 shadow-xs hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/players/${goldenGloveLeader.player?.studentId || goldenGloveLeader.player?.id}`}
                            className="text-xl font-black text-[#2C221E] hover:text-[#1C7ED6] transition-colors truncate block"
                          >
                            {goldenGloveLeader.player?.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {goldenGloveLeader.player?.batch && (
                              <BatchChip
                                name={goldenGloveLeader.player.batch.name}
                                session={goldenGloveLeader.player.batch.session}
                                size="xs"
                                variant="inline"
                                className="text-[10px]"
                              />
                            )}
                            <span className="text-[10px] text-[#7C6E63]">Goalkeeper</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#7C6E63] my-6">No clean sheets yet</p>
                    )}
                  </div>

                  {goldenGloveLeader && (
                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#1C7ED6]">{goldenGloveLeader.cleanSheets}</p>
                        <p className="text-[11px] font-semibold text-[#7C6E63]">Clean Sheets</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="font-semibold text-[#2C221E]">Shot Stopper</p>
                        <p className="text-[11px] text-[#7C6E63]">Wall in front of goal</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
};

