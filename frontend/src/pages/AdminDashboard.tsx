import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { userService } from "../services/user.service.js";
import { accountService } from "../services/account.service.js";
import { User } from "../types/index.js";

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [depositAmounts, setDepositAmounts] = useState<{ [userId: number]: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to load users list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: number) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await userService.toggleUserActive(userId);
      if (res.success) {
        setSuccessMessage(res.message || "User status updated successfully");
        // Update user in local state
        setUsers((prev) =>
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
        // Update account balance in local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId && u.account
              ? { ...u, account: { ...u.account, balance: res.data!.balance } }
              : u
          )
        );
        // Clear input for this user
        setDepositAmounts((prev) => ({ ...prev, [userId]: "" }));
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to deposit funds");
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f7fb" }}>
      <Navbar />

      <div className="container py-4 my-3 flex-grow-1" style={{ maxWidth: "1300px" }}>
        <h3 className="fw-bold mb-4" style={{ color: "#2c5364" }}>
          All Users Overview
        </h3>

        {/* ALERTS */}
        {successMessage && (
          <div className="alert alert-success text-center py-2 mb-3">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger text-center py-2 mb-3">
            {errorMessage}
          </div>
        )}

        {/* STATS BANNER */}
        <div className="card shadow-card p-3 mb-4 bg-white d-flex flex-row justify-content-between align-items-center">
          <h4 className="mb-0 fw-semibold" style={{ color: "#2c5364" }}>
            Total Registered Users
          </h4>
          <h2 className="mb-0 fw-bold" style={{ color: "#203a43" }}>
            {users.length}
          </h2>
        </div>

        {/* USERS TABLE */}
        <div className="card shadow-card overflow-hidden">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading users...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle text-center mb-0">
                  <thead style={{ background: "#203a43", color: "white" }}>
                    <tr>
                      <th className="py-3">Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">Account No</th>
                      <th className="py-3">Balance</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Deposit</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td className="text-monospace">
                          {u.account?.accountNumber || "N/A"}
                        </td>
                        <td className="fw-bold">
                          ₹{" "}
                          {u.account
                            ? u.account.balance.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })
                            : "0.00"}
                        </td>
                        <td>
                          <span className={u.active ? "status-active" : "status-blocked"}>
                            {u.active ? "Active" : "Blocked"}
                          </span>
                        </td>

                        {/* INLINE DEPOSIT */}
                        <td style={{ minWidth: "170px" }}>
                          <form
                            onSubmit={(e) => handleDeposit(e, u.id)}
                            className="d-flex justify-content-center gap-2"
                          >
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              placeholder="₹"
                              style={{ width: "90px" }}
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
                              {processingUserId === u.id ? "..." : "Deposit"}
                            </button>
                          </form>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <Link
                              to={`/admin/transactions/${u.id}`}
                              className="btn btn-sm btn-primary px-2 text-white text-decoration-none"
                              style={{
                                background: "linear-gradient(135deg, #2980b9, #3498db)",
                                border: "none",
                              }}
                            >
                              Transactions
                            </Link>

                            <button
                              onClick={() => handleToggleActive(u.id)}
                              className="btn btn-sm px-2 text-white"
                              style={{
                                background: u.active
                                  ? "linear-gradient(135deg, #e67e22, #f39c12)"
                                  : "linear-gradient(135deg, #27ae60, #2ecc71)",
                                border: "none",
                              }}
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
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
