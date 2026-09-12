import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

interface RoleRouteProps {
  requiredRole: "ROLE_ADMIN" | "ROLE_USER";
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toUpperCase();
  const normalizedUserRole = userRole.startsWith("ROLE_") ? userRole : `ROLE_${userRole}`;

  if (normalizedUserRole !== requiredRole) {
    return <Navigate to={normalizedUserRole === "ROLE_ADMIN" ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
};
