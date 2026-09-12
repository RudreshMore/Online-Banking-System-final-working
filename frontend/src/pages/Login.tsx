import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { authService } from "../services/auth.service.js";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query parameters or router state messages
  const searchParams = new URLSearchParams(location.search);
  const isLogout = searchParams.get("logout") === "true";
  const successState = (location.state as { successMessage?: string })?.successMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        const destination = response.data.user.redirectUrl || 
          (response.data.user.role === "ROLE_ADMIN" ? "/admin/dashboard" : "/dashboard");
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || "Invalid credentials OR account is blocked";
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 px-3"
      style={{
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      }}
    >
      <div
        className="bg-white p-4 p-md-5 rounded-4 shadow-lg w-100"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ color: "#2c5364" }}>
            SecureBank
          </h1>
          <span className="text-muted" style={{ fontSize: "14px" }}>
            Safe • Simple • Smart Banking
          </span>
        </div>

        {/* LOGOUT MESSAGE */}
        {isLogout && (
          <div className="alert alert-success py-2 text-center" style={{ fontSize: "13px" }}>
            You have been logged out successfully
          </div>
        )}

        {/* REGISTRATION SUCCESS MESSAGE */}
        {successState && (
          <div className="alert alert-success py-2 text-center" style={{ fontSize: "13px" }}>
            {successState}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="alert alert-danger py-2 text-center" style={{ fontSize: "13px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Email
            </label>
            <input
              type="email"
              className="form-control py-2"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Password
            </label>
            <input
              type="password"
              className="form-control py-2"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient w-100 py-2 fw-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : null}
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/register" className="text-decoration-none" style={{ color: "#2c5364", fontSize: "14px" }}>
            Create New Account
          </Link>
        </div>

        <div className="text-center mt-2">
          <Link to="/" className="text-decoration-none text-muted" style={{ fontSize: "13px" }}>
            ⬅ Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
