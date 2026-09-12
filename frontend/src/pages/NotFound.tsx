import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export const NotFound: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const destination = !isAuthenticated
    ? "/"
    : isAdmin
    ? "/admin/dashboard"
    : "/dashboard";

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="card shadow-card p-5 text-center" style={{ maxWidth: "500px" }}>
        <h2 className="text-danger fw-bold mb-3">Oops! Something went wrong</h2>
        <p className="text-muted fs-5 mb-4">
          The requested page could not be found or an unexpected error occurred.
        </p>
        <Link to={destination} className="btn btn-primary-gradient px-4 py-2">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
