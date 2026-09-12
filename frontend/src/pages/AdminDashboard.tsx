import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { userService } from "../services/user.service.js";
import { accountService } from "../services/account.service.js";
import { kycService } from "../services/kyc.service.js";
import { adminService } from "../services/admin.service.js";
import {
  UserSpendingAnalytics,
  ProfileUpdateRequest,
  BankVaultOverview,
} from "../types/index.js";
import { formatDate } from "../utils/index.js";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"USERS" | "KYC" | "VAULT">("USERS");

  // USERS & SPENDING ANALYTICS STATE
  const [analyticsUsers, setAnalyticsUsers] = useState<UserSpendingAnalytics[]>([]);
  const [depositAmounts, setDepositAmounts] = useState<{ [userId: number]: string }>({});
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  // KYC STATE
  const [kycRequests, setKycRequests] = useState<ProfileUpdateRequest[]>([]);
  const [selectedKycId, setSelectedKycId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessingKyc, setIsProcessingKyc] = useState(false);

  // VAULT STATE
  const [vaultData, setVaultData] = useState<BankVaultOverview | null>(null);

  // GENERAL
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [analyticsRes, kycRes, vaultRes] = await Promise.all([
        adminService.getSpendingAnalytics(),
        kycService.getAllRequestsAdmin(),
        adminService.getBankVaultOverview(),
      ]);

      if (analyticsRes.data) setAnalyticsUsers(analyticsRes.data);
      if (kycRes.data) setKycRequests(kycRes.data);
      if (vaultRes.data) setVaultData(vaultRes.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (userId: number) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await userService.toggleUserActive(userId);
      if (res.success) {
        setSuccessMessage(res.message || "User status updated successfully");
        setAnalyticsUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
        );
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleDeposit = async (e: React.FormEvent, userId: number) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const rawAmount = depositAmounts[userId];
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid deposit amount greater than zero");
      return;
    }

    setProcessingUserId(userId);

    try {
      const res = await accountService.adminDeposit(userId, amount);
      if (res.success && res.data) {
        setSuccessMessage(res.message || `₹${amount} deposited successfully`);
        setAnalyticsUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, balance: res.data!.balance } : u))
        );
        setDepositAmounts((prev) => ({ ...prev, [userId]: "" }));
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to deposit funds");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleApproveKyc = async (requestId: number) => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsProcessingKyc(true);
    try {
      const res = await kycService.reviewRequest(requestId, "APPROVED", "Approved by Bank Admin");
      if (res.success) {
        setSuccessMessage("KYC update request approved and user profile updated!");
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to approve KYC request");
    } finally {
      setIsProcessingKyc(false);
    }
  };

  const handleRejectKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKycId) return;
    if (!rejectionReason.trim()) {
      setErrorMessage("Please enter a reason for rejection");
      return;
    }

    setIsProcessingKyc(true);
    try {
      const res = await kycService.reviewRequest(selectedKycId, "REJECTED", rejectionReason.trim());
      if (res.success) {
        setSuccessMessage("KYC update request rejected with comment.");
        setShowRejectModal(false);
        setSelectedKycId(null);
        setRejectionReason("");
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to reject KYC request");
    } finally {
      setIsProcessingKyc(false);
    }
  };

  const pendingKycCount = kycRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f7fb" }}>
      <Navbar />

      <div className="container py-4 my-3 flex-grow-1" style={{ maxWidth: "1350px" }}>
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: "#2c5364" }}>
              Bank Administration Console
            </h3>
            <span className="text-muted small">
              Spending Analytics • KYC Approval Desk • Revenue & Tax Vault
            </span>
          </div>

          {/* TAB NAVIGATION */}
          <div className="nav nav-pills bg-white p-1 rounded-3 shadow-sm border mt-3 mt-md-0">
            <button
              className={`nav-link fw-semibold px-3 py-2 ${
                activeTab === "USERS" ? "active bg-primary text-white" : "text-secondary"
              }`}
              onClick={() => setActiveTab("USERS")}
            >
              👥 Users & Spending ({analyticsUsers.length})
            </button>
            <button
              className={`nav-link fw-semibold px-3 py-2 position-relative ${
                activeTab === "KYC" ? "active bg-primary text-white" : "text-secondary"
              }`}
              onClick={() => setActiveTab("KYC")}
            >
              📝 KYC Requests
              {pendingKycCount > 0 && (
                <span className="badge bg-danger ms-2 rounded-pill">{pendingKycCount}</span>
              )}
            </button>
            <button
              className={`nav-link fw-semibold px-3 py-2 ${
                activeTab === "VAULT" ? "active bg-primary text-white" : "text-secondary"
              }`}
              onClick={() => setActiveTab("VAULT")}
            >
              🏦 Revenue & Tax Vault
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {successMessage && (
          <div className="alert alert-success text-center py-2 mb-3 shadow-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger text-center py-2 mb-3 shadow-sm">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading administrative data...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: USERS & SPENDING ANALYTICS */}
            {activeTab === "USERS" && (
              <div>
                {/* METRICS ROW */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card shadow-sm p-3 bg-white border-0 rounded-3">
                      <small className="text-muted">Total Retail Users</small>
                      <h3 className="fw-bold mb-0 text-dark">{analyticsUsers.length}</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm p-3 bg-white border-0 rounded-3">
                      <small className="text-muted">Savings Accounts</small>
                      <h3 className="fw-bold mb-0 text-primary">
                        {analyticsUsers.filter((u) => u.accountType === "SAVINGS").length}
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm p-3 bg-white border-0 rounded-3">
                      <small className="text-muted">Current Accounts</small>
                      <h3 className="fw-bold mb-0 text-warning">
                        {analyticsUsers.filter((u) => u.accountType === "CURRENT").length}
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm p-3 bg-white border-0 rounded-3">
                      <small className="text-muted">Pending KYC Verifications</small>
                      <h3 className="fw-bold mb-0 text-danger">{pendingKycCount}</h3>
                    </div>
                  </div>
                </div>

                {/* USERS TABLE WITH DAY, MONTH, YEAR SPEND */}
                <div className="card shadow-card overflow-hidden border-0">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle text-center mb-0">
                        <thead style={{ background: "#203a43", color: "white" }}>
                          <tr>
                            <th className="py-3 text-start ps-3">User & Account</th>
                            <th className="py-3">Type</th>
                            <th className="py-3">Balance</th>
                            <th className="py-3 text-danger">Spent Today</th>
                            <th className="py-3 text-warning">This Month</th>
                            <th className="py-3 text-info">This Year</th>
                            <th className="py-3">Tax/Fee Paid</th>
                            <th className="py-3">Deposit</th>
                            <th className="py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsUsers.map((u) => (
                            <tr key={u.id}>
                              {/* USER & ACCOUNT */}
                              <td className="text-start ps-3">
                                <div className="fw-bold text-dark">{u.name}</div>
                                <small className="text-muted d-block">{u.email}</small>
                                <span className="font-monospace small text-secondary">
                                  {u.accountNumber || "No Account"}
                                </span>
                              </td>

                              {/* ACCOUNT TYPE */}
                              <td>
                                <span
                                  className={`badge px-2 py-1 ${
                                    u.accountType === "CURRENT"
                                      ? "bg-warning text-dark"
                                      : "bg-primary-subtle text-primary border border-primary-subtle"
                                  }`}
                                >
                                  {u.accountType || "SAVINGS"}
                                </span>
                              </td>

                              {/* BALANCE */}
                              <td className="fw-bold text-success">
                                ₹ {u.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>

                              {/* SPENT TODAY */}
                              <td className="fw-bold text-danger">
                                ₹ {u.todaySpend.toFixed(2)}
                                <small className="text-muted d-block font-monospace" style={{ fontSize: "11px" }}>
                                  Limit: ₹{u.dailyLimit.toLocaleString("en-IN")}
                                </small>
                              </td>

                              {/* THIS MONTH */}
                              <td className="fw-semibold text-dark">
                                ₹ {u.monthSpend.toFixed(2)}
                              </td>

                              {/* THIS YEAR */}
                              <td className="fw-semibold text-dark">
                                ₹ {u.yearSpend.toFixed(2)}
                              </td>

                              {/* TAX / FEES PAID */}
                              <td>
                                <div className="small fw-semibold text-secondary">
                                  Fee: ₹{u.totalFeesPaid.toFixed(2)}
                                </div>
                                {u.totalTaxPaid > 0 && (
                                  <div className="small text-danger">
                                    Tax: ₹{u.totalTaxPaid.toFixed(2)}
                                  </div>
                                )}
                              </td>

                              {/* INLINE DEPOSIT */}
                              <td style={{ minWidth: "160px" }}>
                                <form
                                  onSubmit={(e) => handleDeposit(e, u.id)}
                                  className="d-flex justify-content-center gap-1"
                                >
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    placeholder="₹"
                                    style={{ width: "80px" }}
                                    min="1"
                                    value={depositAmounts[u.id] || ""}
                                    onChange={(e) =>
                                      setDepositAmounts((prev) => ({
                                        ...prev,
                                        [u.id]: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                  <button
                                    type="submit"
                                    className="btn btn-sm btn-success px-2"
                                    disabled={processingUserId === u.id}
                                  >
                                    {processingUserId === u.id ? "..." : "+"}
                                  </button>
                                </form>
                              </td>

                              {/* ACTIONS */}
                              <td>
                                <div className="d-flex justify-content-center gap-1">
                                  <Link
                                    to={`/admin/transactions/${u.id}`}
                                    className="btn btn-sm btn-outline-primary px-2"
                                    title="View Passbook"
                                  >
                                    📜
                                  </Link>

                                  <button
                                    onClick={() => handleToggleActive(u.id)}
                                    className={`btn btn-sm px-2 text-white ${
                                      u.active ? "btn-warning" : "btn-success"
                                    }`}
                                  >
                                    {u.active ? "Block" : "Unblock"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KYC CHANGE REQUESTS QUEUE */}
            {activeTab === "KYC" && (
              <div className="card shadow-card p-4 bg-white border-0 rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: "#2c5364" }}>
                      KYC & Profile Change Review Queue
                    </h5>
                    <p className="text-muted small mb-0">
                      Verify identity documents and approve or reject requested modifications
                    </p>
                  </div>
                  <span className="badge bg-warning text-dark px-3 py-2 fs-6">
                    {pendingKycCount} Pending Approvals
                  </span>
                </div>

                {kycRequests.length === 0 ? (
                  <div className="alert alert-info text-center py-5">
                    No KYC or profile update requests in the queue.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: "#203a43", color: "white" }}>
                        <tr>
                          <th>User</th>
                          <th>Current Details</th>
                          <th>Requested Changes</th>
                          <th>Reason & Proof</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kycRequests.map((req) => {
                          const isPending = req.status === "PENDING";
                          const isApproved = req.status === "APPROVED";
                          const isRejected = req.status === "REJECTED";

                          return (
                            <tr key={req.id}>
                              {/* USER */}
                              <td>
                                <div className="fw-bold">{req.user?.name}</div>
                                <div className="small text-muted">{req.user?.email}</div>
                                <div className="small text-secondary">{req.user?.mobileNumber}</div>
                              </td>

                              {/* CURRENT */}
                              <td className="small text-muted">
                                <div>Name: {req.user?.name}</div>
                                <div>Aadhaar: {req.user?.currentAadhaar || "None"}</div>
                                <div>DOB: {req.user?.currentDob || "None"}</div>
                              </td>

                              {/* REQUESTED */}
                              <td>
                                <ul className="small mb-0 ps-3">
                                  {req.requestedChanges.name && (
                                    <li>New Name: <strong className="text-primary">{req.requestedChanges.name}</strong></li>
                                  )}
                                  {req.requestedChanges.aadhaarNumber && (
                                    <li>New Aadhaar: <strong className="text-primary">{req.requestedChanges.aadhaarNumber}</strong></li>
                                  )}
                                  {req.requestedChanges.dob && (
                                    <li>New DOB: <strong className="text-primary">{req.requestedChanges.dob}</strong></li>
                                  )}
                                </ul>
                              </td>

                              {/* REASON & PROOF */}
                              <td style={{ maxWidth: "250px" }}>
                                <div className="small fw-semibold">{req.reason}</div>
                                {req.proofDocument && (
                                  <a
                                    href={req.proofDocument}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="small text-primary text-truncate d-block mt-1"
                                  >
                                    🔗 View Attached Proof
                                  </a>
                                )}
                              </td>

                              {/* STATUS */}
                              <td>
                                <span
                                  className={`badge ${
                                    isApproved
                                      ? "bg-success"
                                      : isRejected
                                      ? "bg-danger"
                                      : "bg-warning text-dark"
                                  }`}
                                >
                                  {req.status}
                                </span>
                                {req.adminComment && (
                                  <div className="small text-muted mt-1" style={{ fontSize: "11px" }}>
                                    {req.adminComment}
                                  </div>
                                )}
                              </td>

                              {/* ACTIONS */}
                              <td>
                                {isPending ? (
                                  <div className="d-flex gap-2">
                                    <button
                                      onClick={() => handleApproveKyc(req.id)}
                                      className="btn btn-sm btn-success px-3"
                                      disabled={isProcessingKyc}
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedKycId(req.id);
                                        setRejectionReason("");
                                        setShowRejectModal(true);
                                      }}
                                      className="btn btn-sm btn-danger px-3"
                                      disabled={isProcessingKyc}
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted small">Reviewed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BANK REVENUE & TAX VAULT */}
            {activeTab === "VAULT" && vaultData && (
              <div>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="card shadow-sm p-4 bg-white rounded-3 border-0">
                      <h6 className="text-muted mb-1">Bank Vault Balance</h6>
                      <h2 className="fw-bold text-success mb-0">
                        ₹ {vaultData.vaultBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h2>
                      <small className="text-muted font-monospace">{vaultData.vaultAccountNumber}</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm p-4 bg-white rounded-3 border-0">
                      <h6 className="text-muted mb-1">Total ₹0.50 Fees Collected</h6>
                      <h2 className="fw-bold text-primary mb-0">
                        ₹ {vaultData.totalFeesCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h2>
                      <small className="text-muted">{vaultData.totalTransactionsCharged} transfers charged</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm p-4 bg-white rounded-3 border-0">
                      <h6 className="text-muted mb-1">Total GST Tax Collected</h6>
                      <h2 className="fw-bold text-danger mb-0">
                        ₹ {vaultData.totalTaxCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h2>
                      <small className="text-muted">Statutory remittance reserve</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm p-4 bg-white rounded-3 border-0">
                      <h6 className="text-muted mb-1">Gross Platform Revenue</h6>
                      <h2 className="fw-bold text-dark mb-0">
                        ₹ {vaultData.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h2>
                      <small className="text-muted">Combined fees + taxes credited</small>
                    </div>
                  </div>
                </div>

                {/* RECENT VAULT TRANSACTIONS */}
                <div className="card shadow-card p-4 bg-white border-0 rounded-4">
                  <h5 className="fw-bold mb-3" style={{ color: "#2c5364" }}>
                    Recent Vault Revenue Credits
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle text-center mb-0">
                      <thead style={{ background: "#203a43", color: "white" }}>
                        <tr>
                          <th>Transaction Ref</th>
                          <th>Debited User Account</th>
                          <th>Fee Credited</th>
                          <th>GST Tax Credited</th>
                          <th>Total Credited</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vaultData.recentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="font-monospace text-primary fw-semibold">{tx.referenceId}</td>
                            <td className="font-monospace">{tx.fromAccount}</td>
                            <td className="fw-bold text-primary">₹ {tx.fee.toFixed(2)}</td>
                            <td className="fw-bold text-danger">₹ {tx.tax.toFixed(2)}</td>
                            <td className="fw-bold text-success">₹ {tx.amount.toFixed(2)}</td>
                            <td className="text-muted small">
                              {tx.transactionDate ? formatDate(tx.transactionDate) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="p-3 text-white text-center"
                style={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)" }}
              >
                <h5 className="fw-bold mb-0">Reject KYC Request</h5>
              </div>

              <form onSubmit={handleRejectKyc} className="p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Rejection Reason (Sent directly to User) *
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Uploaded proof document is illegible, please upload a clear scanned copy of your Aadhaar card."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light w-50"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger w-50 fw-semibold"
                    disabled={isProcessingKyc || !rejectionReason.trim()}
                  >
                    {isProcessingKyc ? "Processing..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
