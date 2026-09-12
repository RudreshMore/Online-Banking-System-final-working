import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login?logout=true");
  };

  if (isAuthenticated && isAdmin) {
    return (
      <nav className="navbar navbar-expand-lg bg-bank-dark px-4 py-3 shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand text-white fw-bold fs-4" to="/admin/dashboard">
            SecureBank • Admin
          </Link>
          <div className="d-flex align-items-center gap-3 ms-auto">
            <Link className="text-white text-decoration-none" to="/admin/dashboard">
              Dashboard
            </Link>
            <Link className="text-white text-decoration-none" to="/admin/transactions">
              All Transactions
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm ms-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  if (isAuthenticated) {
    return (
      <nav className="navbar navbar-expand-lg bg-bank-dark px-4 py-3 shadow-sm">
        <div className="container">
          <Link className="navbar-brand text-white fw-bold fs-4" to="/dashboard">
            SecureBank
          </Link>
          <button
            className="navbar-toggler navbar-dark"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#userNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="userNav">
            <div className="navbar-nav ms-auto align-items-center gap-2">
              <Link className="nav-link text-white" to="/dashboard">
                Home
              </Link>
              <Link className="nav-link text-white" to="/transactions">
                Transactions
              </Link>
              <Link className="nav-link text-white" to="/transfer">
                Transfer
              </Link>
              <Link className="nav-link text-white" to="/profile">
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline-light btn-sm ms-lg-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Public Guest Navbar
  return (
    <nav className="navbar navbar-expand-lg bg-white fixed-top shadow-sm py-3">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 text-dark" to="/">
          SecureBank
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="publicNav">
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/services">
                Services
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/contact">
                Contact
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/help">
                Help
              </Link>
            </li>
            <li className="nav-item ms-lg-2">
              <Link className="btn btn-primary-gradient px-4 py-2" to="/login">
                Login
              </Link>
            </li>
            <li className="nav-item">
              <Link className="btn btn-warning px-3 py-2 text-dark fw-semibold" to="/register">
                Open Account
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
