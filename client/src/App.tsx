import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { PublicPlayerProfilePage } from "@/pages/players/PublicPlayerProfilePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Homepage with Red-Brick & Beige Theme */}
        <Route path="/" element={<HomePage />} />

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

