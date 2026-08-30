import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("csepl_token");
  const user = api.auth.getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
  }

  return <>{children}</>;
};
