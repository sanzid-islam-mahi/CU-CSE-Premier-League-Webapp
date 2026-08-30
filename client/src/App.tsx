import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { PublicPlayerProfilePage } from "@/pages/players/PublicPlayerProfilePage";
import { TournamentListPage } from "@/pages/tournaments/TournamentListPage";
import { TournamentDetailPage } from "@/pages/tournaments/TournamentDetailPage";
import { TeamDetailPage } from "@/pages/teams/TeamDetailPage";
import { BatchListPage } from "@/pages/batches/BatchListPage";
import { BatchDetailPage } from "@/pages/batches/BatchDetailPage";
import { MatchDetailPage } from "@/pages/matches/MatchDetailPage";
import { LiveScorerPage } from "@/pages/matches/LiveScorerPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Homepage with Red-Brick & Beige Theme */}
            <Route path="/" element={<HomePage />} />

            {/* Department Batches Hub & Showcase */}
            <Route path="/batches" element={<BatchListPage />} />
            <Route path="/batches/:slug" element={<BatchDetailPage />} />

            {/* Tournaments Hub & Public Detail Page */}
            <Route path="/tournaments" element={<TournamentListPage />} />
            <Route path="/tournaments/:slug" element={<TournamentDetailPage />} />

            {/* Live Match Arena & Scorer Console */}
            <Route path="/matches/:id" element={<MatchDetailPage />} />
            <Route
              path="/matches/:id/score"
              element={
                <ProtectedRoute>
                  <LiveScorerPage />
                </ProtectedRoute>
              }
            />

            {/* Team Detail Page & Squad View */}
            <Route path="/teams/:id" element={<TeamDetailPage />} />

            {/* Player Profile & Sports Preferences Setup (Protected) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Public Player Profile Card */}
            <Route path="/players/:idOrRoll" element={<PublicPlayerProfilePage />} />

            {/* Dedicated Admin Portal (from Footer Link) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Department Admin Dashboard with Batches, Players, Tournaments (Admin Protected) */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Themed 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;


