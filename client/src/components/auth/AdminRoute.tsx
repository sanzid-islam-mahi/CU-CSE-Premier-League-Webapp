import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("csepl_token");
  const user = api.auth.getCurrentUser();

  if (!token || !user || user.role !== "ADMIN") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
