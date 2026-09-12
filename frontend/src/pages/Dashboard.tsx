import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { useAuth } from "../context/AuthContext.js";
import { accountService } from "../services/account.service.js";
import { Account } from "../types/index.js";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const transferSuccess = searchParams.get("transferSuccess") === "true";

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountService.getMyAccount();
        if (res.data) {
          setAccount(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch account", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f7fb" }}>
      <Navbar />

      <div className="container py-4 my-3 flex-grow-1" style={{ maxWidth: "1200px" }}>
        {/* TRANSFER SUCCESS BANNER */}
        {transferSuccess && (
          <div className="alert alert-success text-center shadow-sm py-3 mb-4 rounded-3">
            ✅ <strong>Success!</strong> Money transferred successfully!
          </div>
        )}

        {/* WELCOME BANNER */}
        <div className="mb-4">
          <h3 className="fw-bold" style={{ color: "#2c5364" }}>
            Welcome, {user?.name || "User"} 👋
          </h3>
          <span className="text-muted fs-6">Your personal banking dashboard</span>
        </div>

        {/* METRIC CARDS */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white">
              <h5 className="text-muted fw-normal fs-6 mb-2">Account Balance</h5>
              <p className="fs-2 fw-bold mb-1" style={{ color: "#0f2027" }}>
                ₹ {isLoading ? "..." : account ? account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
              </p>
              <small className="text-secondary">Available balance</small>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white">
              <h5 className="text-muted fw-normal fs-6 mb-2">Account Number</h5>
              <p className="fs-3 fw-bold mb-1" style={{ color: "#0f2027" }}>
                {isLoading ? "..." : account?.accountNumber || "—"}
              </p>
              <small className="text-secondary">SecureBank Savings</small>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white">
              <h5 className="text-muted fw-normal fs-6 mb-2">Account Status</h5>
              <p className="fs-3 fw-bold mb-1">
                <span className={user?.active ? "status-active" : "status-blocked"}>
                  {user?.active ? "Active" : "Blocked"}
                </span>
              </p>
              <small className="text-secondary">Account health</small>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="my-5">
          <h4 className="fw-bold mb-3" style={{ color: "#2c5364" }}>
            Quick Actions
          </h4>
          <div className="row g-3">
            <div className="col-md-4">
              <Link
                to="/transfer"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                💸 Transfer Money
              </Link>
            </div>

            <div className="col-md-4">
              <Link
                to="/transactions"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                📄 View Transactions
              </Link>
            </div>

            <div className="col-md-4">
              <Link
                to="/profile"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                👤 Profile
              </Link>
            </div>
          </div>
        </div>

        {/* SECURITY NOTICE */}
        <div
          className="bg-white p-4 rounded-3 shadow-sm mb-4"
          style={{ borderLeft: "5px solid #2c5364" }}
        >
          🔒 <strong>Security Notice:</strong> Never share your OTP, password, or account details. SecureBank will never ask for sensitive information.
        </div>
      </div>

      <Footer />
    </div>
  );
};
