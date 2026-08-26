import React, { useRef, useEffect, useState } from "react";
import { Download, Share2, Copy, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchStoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

export const MatchStoryCardModal: React.FC<MatchStoryCardModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && match) {
      renderStoryCard();
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const isCricket = match.tournament?.sport === "CRICKET";
  const innings1 = match.cricketInnings?.find((x: any) => x.inningsNumber === 1);
  const innings2 = match.cricketInnings?.find((x: any) => x.inningsNumber === 2);

  // Find Top Batter & Top Bowler across match
  let topBatter: any = null;
  let topBowler: any = null;

  if (isCricket) {
    match.cricketInnings?.forEach((inn: any) => {
      inn.battingScorecards?.forEach((bat: any) => {
        if (!topBatter || bat.runs > topBatter.runs) {
          topBatter = { ...bat, teamName: inn.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name };
        }
      });
      inn.bowlingScorecards?.forEach((bowl: any) => {
        if (!topBowler || bowl.wickets > topBowler.wickets || (bowl.wickets === topBowler.wickets && bowl.runs < topBowler.runs)) {
          topBowler = { ...bowl, teamName: inn.bowlingTeamId === match.teamAId ? match.teamA.name : match.teamB.name };
        }
      });
    });
  }

  const renderStoryCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI Canvas setup (1080 x 1350 for Instagram / WhatsApp Stories)
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Canvas
    ctx.fillStyle = "#1E1410";
    ctx.fillRect(0, 0, width, height);

    // Subtle dark brick pattern gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#2D1812");
    bgGradient.addColorStop(0.5, "#170F0C");
    bgGradient.addColorStop(1, "#36160F");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Top Header Accent Banner
    const topBarGradient = ctx.createLinearGradient(0, 0, width, 0);
    topBarGradient.addColorStop(0, "#9E2A2B");
    topBarGradient.addColorStop(0.5, "#842021");
    topBarGradient.addColorStop(1, "#C92A2A");
    ctx.fillStyle = topBarGradient;
    ctx.fillRect(0, 0, width, 24);

    // 3. Tournament Branding
    ctx.fillStyle = "#FAF0E6";
    ctx.font = "900 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", width / 2, 90);

    ctx.fillStyle = "#E8D6C3";
    ctx.font = "700 24px sans-serif";
    ctx.fillText("UNIVERSITY OF CHITTAGONG", width / 2, 130);

    // Gold Tournament Badge
    ctx.fillStyle = "#FAF7F2";
    ctx.font = "900 52px sans-serif";
    ctx.fillText(match.tournament?.name || "CSE PREMIER LEAGUE 2026", width / 2, 210);

    ctx.fillStyle = "#F59F00";
    ctx.font = "800 24px sans-serif";
    ctx.fillText(`MATCH #${match.matchNumber} · ${match.stage?.replace("_", " ")} · ${match.venue || "CU CSE Grounds"}`, width / 2, 260);

    // 4. Center Match Scoreboard Box
    const boxX = 60;
    const boxY = 320;
    const boxW = width - 120;
    const boxH = 460;

    ctx.fillStyle = "#261A16";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 40);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4A3228";
    ctx.stroke();

    // Team A Card
    const teamAY = boxY + 110;
    ctx.fillStyle = "#FAF7F2";
    ctx.font = "900 44px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(match.teamA.name, boxX + 60, teamAY);

    ctx.fillStyle = "#A89A8D";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(match.teamA.batch?.name || "CU CSE", boxX + 60, teamAY + 40);

    // Team A Score
    ctx.textAlign = "right";
    ctx.fillStyle = match.winnerTeamId === match.teamAId ? "#F59F00" : "#FAF7F2";
    ctx.font = "900 64px monospace";
    let teamAScoreStr = "-";
    if (isCricket) {
      if (innings1?.battingTeamId === match.teamAId) teamAScoreStr = `${innings1.totalRuns}/${innings1.totalWickets} (${innings1.totalOvers} ov)`;
      else if (innings2?.battingTeamId === match.teamAId) teamAScoreStr = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOvers} ov)`;
    } else {
      teamAScoreStr = `${match.footballDetail?.teamAScore || 0}`;
    }
    ctx.fillText(teamAScoreStr, boxX + boxW - 60, teamAY + 15);

    // Divider
    ctx.strokeStyle = "#3D2A22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 60, boxY + 220);
    ctx.lineTo(boxX + boxW - 60, boxY + 220);
    ctx.stroke();

    // Team B Card
    const teamBY = boxY + 310;
    ctx.textAlign = "left";
    ctx.fillStyle = "#FAF7F2";
    ctx.font = "900 44px sans-serif";
    ctx.fillText(match.teamB.name, boxX + 60, teamBY);

    ctx.fillStyle = "#A89A8D";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(match.teamB.batch?.name || "CU CSE", boxX + 60, teamBY + 40);

    // Team B Score
    ctx.textAlign = "right";
    ctx.fillStyle = match.winnerTeamId === match.teamBId ? "#F59F00" : "#FAF7F2";
    ctx.font = "900 64px monospace";
    let teamBScoreStr = "-";
    if (isCricket) {
      if (innings1?.battingTeamId === match.teamBId) teamBScoreStr = `${innings1.totalRuns}/${innings1.totalWickets} (${innings1.totalOvers} ov)`;
      else if (innings2?.battingTeamId === match.teamBId) teamBScoreStr = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOvers} ov)`;
    } else {
      teamBScoreStr = `${match.footballDetail?.teamBScore || 0}`;
    }
    ctx.fillText(teamBScoreStr, boxX + boxW - 60, teamBY + 15);

    // Result Banner inside Scoreboard Box
    const resultY = boxY + boxH - 55;
    ctx.fillStyle = "#FAF0E6";
    ctx.textAlign = "center";
    ctx.font = "800 28px sans-serif";
    ctx.fillText(
      match.resultSummary ? `🏆 ${match.resultSummary.toUpperCase()}` : `STATUS: ${match.status}`,
      width / 2,
      resultY
    );

    // 5. Match Highlights Box (Top Batter & Bowler / POTM)
    const perfY = 820;
    const perfH = 380;
    ctx.fillStyle = "#261A16";
    ctx.beginPath();
    ctx.roundRect(boxX, perfY, boxW, perfH, 40);
    ctx.fill();
    ctx.strokeStyle = "#4A3228";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#F59F00";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("MATCH PERFORMANCE SPOTLIGHT 🌟", width / 2, perfY + 65);

    // Top Batter Card
    if (topBatter) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#FAF7F2";
      ctx.font = "800 30px sans-serif";
      ctx.fillText(`🏏 Top Batter: ${topBatter.player?.name}`, boxX + 60, perfY + 140);
      ctx.fillStyle = "#A89A8D";
      ctx.font = "700 24px monospace";
      ctx.fillText(`${topBatter.runs} runs off ${topBatter.balls} balls (${topBatter.fours}x4, ${topBatter.sixes}x6) · SR: ${topBatter.balls > 0 ? ((topBatter.runs / topBatter.balls) * 100).toFixed(1) : 0}`, boxX + 60, perfY + 180);
    }

    // Top Bowler Card
    if (topBowler) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#FAF7F2";
      ctx.font = "800 30px sans-serif";
      ctx.fillText(`⚾ Top Bowler: ${topBowler.player?.name}`, boxX + 60, perfY + 245);
      ctx.fillStyle = "#A89A8D";
      ctx.font = "700 24px monospace";
      ctx.fillText(`${topBowler.wickets} wickets for ${topBowler.runs} runs (${topBowler.overs} overs)`, boxX + 60, perfY + 285);
    }

    // POTM Award Banner
    if (match.playerOfTheMatch) {
      ctx.fillStyle = "#F59F00";
      ctx.font = "900 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`👑 PLAYER OF THE MATCH: ${match.playerOfTheMatch.name.toUpperCase()}`, width / 2, perfY + 345);
    }

    // 6. Footer Brand Watermark
    ctx.fillStyle = "#7C6E63";
    ctx.font = "700 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CSE PREMIER LEAGUE · OFFICIAL LIVE MATCH CENTER", width / 2, height - 50);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `CPL-Match-${match.matchNumber}-${match.teamA.shortName}-vs-${match.teamB.shortName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (e) {
          alert("Clipboard copy not supported on this browser. Please use Download.");
        }
      }
    });
  };

  const handleShareWhatsApp = () => {
    const summaryText = `*CSE Premier League 2026 - Match #${match.matchNumber}*\n` +
      `🏏 *${match.teamA.name}* vs *${match.teamB.name}*\n` +
      `🏆 Result: ${match.resultSummary || "Live Match in Progress"}\n\n` +
      `Check full scorecard: ${window.location.origin}/matches/${match.id}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1E1410] border-2 border-[#4A3228] rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col relative overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#3D2A22] flex items-center justify-between bg-[#261A16]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F59F00]" />
            <h3 className="text-sm font-black text-white">Social Match Story Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[#A89A8D] hover:text-white hover:bg-[#3D2A22]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col items-center gap-4 bg-[#140D0B]">
          <canvas
            ref={canvasRef}
            className="w-full max-w-sm rounded-2xl shadow-2xl border border-[#4A3228] aspect-[4/5] object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#3D2A22] bg-[#261A16] flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyImage}
            className="border-[#4A3228] bg-[#1E1410] text-[#E8D6C3] hover:bg-[#36160F] text-xs h-10 px-4 rounded-xl font-bold flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-[#20C997]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Poster"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs h-10 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>

            <Button
              type="button"
              onClick={handleDownloadImage}
              className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs h-10 px-5 rounded-xl font-black flex items-center gap-1.5 shadow-md shadow-[#9E2A2B]/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
