import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { PublicPlayerProfilePage } from "@/pages/players/PublicPlayerProfilePage";
import { TournamentListPage } from "@/pages/tournaments/TournamentListPage";
import { TournamentDetailPage } from "@/pages/tournaments/TournamentDetailPage";
import { TeamDetailPage } from "@/pages/teams/TeamDetailPage";
import { MatchDetailPage } from "@/pages/matches/MatchDetailPage";
import { LiveScorerPage } from "@/pages/matches/LiveScorerPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Homepage with Red-Brick & Beige Theme */}
        <Route path="/" element={<HomePage />} />

        {/* Tournaments Hub & Public Detail Page */}
        <Route path="/tournaments" element={<TournamentListPage />} />
        <Route path="/tournaments/:slug" element={<TournamentDetailPage />} />

        {/* Live Match Arena & Scorer Console */}
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/matches/:id/score" element={<LiveScorerPage />} />

        {/* Team Detail Page & Squad View */}
        <Route path="/teams/:id" element={<TeamDetailPage />} />

        {/* Player Profile & Sports Preferences Setup */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Public Player Profile Card */}
        <Route path="/players/:idOrRoll" element={<PublicPlayerProfilePage />} />

        {/* Dedicated Admin Portal (from Footer Link) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Department Admin Dashboard with Batches, Players, Tournaments */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

