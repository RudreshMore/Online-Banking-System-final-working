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

  // MPIN Protected Balance State
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [enteredMpin, setEnteredMpin] = useState("");
  const [mpinError, setMpinError] = useState("");
  const [isVerifyingMpin, setIsVerifyingMpin] = useState(false);

  // Change MPIN State
  const [showChangeMpinModal, setShowChangeMpinModal] = useState(false);
  const [currentMpinInput, setCurrentMpinInput] = useState("");
  const [newMpinInput, setNewMpinInput] = useState("");
  const [changeMpinMsg, setChangeMpinMsg] = useState("");
  const [changeMpinErr, setChangeMpinErr] = useState("");
  const [isChangingMpin, setIsChangingMpin] = useState(false);

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

  const handleVerifyMpin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpinError("");

    if (!/^\d{4}$/.test(enteredMpin)) {
      setMpinError("Please enter a valid 4-digit security MPIN");
      return;
    }

    setIsVerifyingMpin(true);
    try {
      const res = await accountService.checkBalance(enteredMpin);
      if (res.success && res.data) {
        setAccount((prev) => (prev ? { ...prev, balance: res.data!.balance } : prev));
        setIsBalanceRevealed(true);
        setShowMpinModal(false);
        setEnteredMpin("");
      }
    } catch (err: any) {
      setMpinError(err.response?.data?.message || "Incorrect MPIN. Please try again.");
    } finally {
      setIsVerifyingMpin(false);
    }
  };

  const handleChangeMpin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeMpinErr("");
    setChangeMpinMsg("");

    if (!/^\d{4}$/.test(newMpinInput)) {
      setChangeMpinErr("New MPIN must be exactly 4 digits");
      return;
    }

    setIsChangingMpin(true);
    try {
      const res = await accountService.changeMpin(currentMpinInput, newMpinInput);
      if (res.success) {
        setChangeMpinMsg("Security MPIN updated successfully!");
        setCurrentMpinInput("");
        setNewMpinInput("");
        setTimeout(() => {
          setShowChangeMpinModal(false);
          setChangeMpinMsg("");
        }, 1500);
      }
    } catch (err: any) {
      setChangeMpinErr(err.response?.data?.message || "Failed to update MPIN");
    } finally {
      setIsChangingMpin(false);
    }
  };

  const isCurrentAccount = account?.accountType === "CURRENT";

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
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold" style={{ color: "#2c5364" }}>
              Welcome, {user?.name || "User"} 👋
            </h3>
            <span className="text-muted fs-6">Your personal banking dashboard</span>
          </div>

          <div className="mt-2 mt-md-0">
            <span
              className={`badge px-3 py-2 fs-6 shadow-sm ${
                isCurrentAccount ? "bg-warning text-dark" : "bg-primary"
              }`}
            >
              💼 {isCurrentAccount ? "Current Account" : "Savings Account"}
            </span>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="row g-4 mb-4">
          {/* BALANCE CARD (MPIN PROTECTED) */}
          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white position-relative">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="text-muted fw-normal fs-6 mb-0">Account Balance</h5>
                <span className="badge bg-light text-secondary border">🔒 MPIN Secured</span>
              </div>

              {isBalanceRevealed ? (
                <div>
                  <p className="fs-2 fw-bold mb-1" style={{ color: "#0f2027" }}>
                    ₹{" "}
                    {isLoading
                      ? "..."
                      : account
                      ? account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                      : "0.00"}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-success fw-semibold">● Verified & Active</small>
                    <button
                      onClick={() => setIsBalanceRevealed(false)}
                      className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="fs-2 fw-bold mb-1 letter-spacing-2" style={{ color: "#7f8c8d" }}>
                    ₹ ••••••••
                  </p>
                  <button
                    onClick={() => {
                      setMpinError("");
                      setEnteredMpin("");
                      setShowMpinModal(true);
                    }}
                    className="btn btn-sm btn-primary-gradient px-3 py-1 shadow-sm mt-1"
                  >
                    👁️ Check Balance
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACCOUNT NUMBER & LIMIT CARD */}
          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white">
              <h5 className="text-muted fw-normal fs-6 mb-2">Account Number</h5>
              <p className="fs-3 fw-bold mb-1" style={{ color: "#0f2027" }}>
                {isLoading ? "..." : account?.accountNumber || "—"}
              </p>
              <div className="d-flex justify-content-between text-secondary small">
                <span>
                  Limit: ₹
                  {account?.dailyLimit
                    ? account.dailyLimit.toLocaleString("en-IN")
                    : isCurrentAccount
                    ? "5,00,000"
                    : "50,000"}
                  /day
                </span>
                <span className="badge bg-light text-dark border">
                  Fee: ₹0.50 {isCurrentAccount ? "+ GST" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ACCOUNT HEALTH CARD */}
          <div className="col-md-4">
            <div className="card shadow-card p-4 h-100 bg-white">
              <h5 className="text-muted fw-normal fs-6 mb-2">Account Status</h5>
              <p className="fs-3 fw-bold mb-1">
                <span className={user?.active ? "status-active" : "status-blocked"}>
                  {user?.active ? "Active" : "Blocked"}
                </span>
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-secondary">KYC Compliant</small>
                <button
                  onClick={() => setShowChangeMpinModal(true)}
                  className="btn btn-sm btn-outline-secondary py-0 px-2"
                  style={{ fontSize: "12px" }}
                >
                  🔑 Change MPIN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="my-5">
          <h4 className="fw-bold mb-3" style={{ color: "#2c5364" }}>
            Quick Actions
          </h4>
          <div className="row g-3">
            <div className="col-md-3">
              <Link
                to="/transfer"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                💸 Transfer Money
              </Link>
            </div>

            <div className="col-md-3">
              <Link
                to="/transactions"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                📄 Transactions
              </Link>
            </div>

            <div className="col-md-3">
              <Link
                to="/profile"
                className="btn btn-primary-gradient w-100 py-3 d-flex align-items-center justify-content-center fs-5 text-decoration-none shadow"
              >
                👤 KYC Profile
              </Link>
            </div>

            <div className="col-md-3">
              <button
                onClick={() => setShowChangeMpinModal(true)}
                className="btn btn-outline-dark w-100 py-3 d-flex align-items-center justify-content-center fs-5 shadow-sm bg-white"
              >
                🔑 Security MPIN
              </button>
            </div>
          </div>
        </div>

        {/* SECURITY NOTICE */}
        <div
          className="bg-white p-4 rounded-3 shadow-sm mb-4"
          style={{ borderLeft: "5px solid #2c5364" }}
        >
          🔒 <strong>Banking Rule:</strong> Never share your 4-digit MPIN or credentials. In case of discrepancies in KYC details (Aadhaar, Name, DOB), submit a change request directly to the Bank Admin via your Profile page.
        </div>
      </div>

      {/* MPIN VERIFICATION MODAL */}
      {showMpinModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px" }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="p-4 text-white text-center"
                style={{ background: "linear-gradient(135deg, #0f2027, #2c5364)" }}
              >
                <h4 className="fw-bold mb-1">Enter Security MPIN</h4>
                <p className="small text-white-50 mb-0">Enter your 4-digit PIN to check balance</p>
              </div>

              <div className="p-4 bg-white">
                {mpinError && (
                  <div className="alert alert-danger py-2 text-center small mb-3">
                    {mpinError}
                  </div>
                )}

                <form onSubmit={handleVerifyMpin}>
                  <div className="mb-4 text-center">
                    <input
                      type="password"
                      className="form-control form-control-lg text-center fw-bold fs-2 letter-spacing-4"
                      placeholder="••••"
                      maxLength={4}
                      autoFocus
                      value={enteredMpin}
                      onChange={(e) => setEnteredMpin(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                    <small className="text-muted mt-2 d-block">
                      Default MPIN is <strong>1234</strong> if not changed.
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-light w-50 py-2"
                      onClick={() => setShowMpinModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient w-50 py-2 fw-semibold"
                      disabled={isVerifyingMpin || enteredMpin.length !== 4}
                    >
                      {isVerifyingMpin ? "Verifying..." : "Reveal Balance"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE MPIN MODAL */}
      {showChangeMpinModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="p-4 text-white text-center"
                style={{ background: "linear-gradient(135deg, #0f2027, #203a43)" }}
              >
                <h4 className="fw-bold mb-1">Change Security MPIN</h4>
                <p className="small text-white-50 mb-0">Set a new 4-digit PIN for transactions</p>
              </div>

              <div className="p-4 bg-white">
                {changeMpinErr && (
                  <div className="alert alert-danger py-2 text-center small mb-3">
                    {changeMpinErr}
                  </div>
                )}
                {changeMpinMsg && (
                  <div className="alert alert-success py-2 text-center small mb-3">
                    {changeMpinMsg}
                  </div>
                )}

                <form onSubmit={handleChangeMpin}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">
                      Current MPIN
                    </label>
                    <input
                      type="password"
                      className="form-control text-center fs-4 letter-spacing-2"
                      placeholder="••••"
                      maxLength={4}
                      value={currentMpinInput}
                      onChange={(e) => setCurrentMpinInput(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-secondary small fw-semibold">
                      New 4-Digit MPIN
                    </label>
                    <input
                      type="password"
                      className="form-control text-center fs-4 letter-spacing-2"
                      placeholder="••••"
                      maxLength={4}
                      value={newMpinInput}
                      onChange={(e) => setNewMpinInput(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-light w-50 py-2"
                      onClick={() => setShowChangeMpinModal(false)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient w-50 py-2 fw-semibold"
                      disabled={isChangingMpin || newMpinInput.length !== 4}
                    >
                      {isChangingMpin ? "Updating..." : "Update MPIN"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
