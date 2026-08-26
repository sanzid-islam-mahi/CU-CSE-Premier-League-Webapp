import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Homepage with Red-Brick & Beige Theme */}
        <Route path="/" element={<HomePage />} />

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

