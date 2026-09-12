import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { transactionService } from "../services/transaction.service.js";
import { Transaction } from "../types/index.js";
import { formatDate } from "../utils/index.js";

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await transactionService.getMyTransactions();
        if (res.data) {
          setTransactions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "DEBIT") return tx.type === "DEBIT";
    if (filter === "CREDIT") return tx.type === "CREDIT" || tx.type === "ADMIN_DEPOSIT";
    return true;
  });

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="container py-4 my-3 flex-grow-1" style={{ maxWidth: "1000px" }}>
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: "#2c5364" }}>
              Passbook & Transactions
            </h3>
            <span className="text-muted small">PhonePe-style live transaction ledger</span>
          </div>

          <div className="d-flex gap-2 mt-2 mt-md-0">
            <div className="btn-group btn-group-sm">
              <button
                className={`btn ${viewMode === "CARDS" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("CARDS")}
              >
                📱 Cards
              </button>
              <button
                className={`btn ${viewMode === "TABLE" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("TABLE")}
              >
                📋 Table
              </button>
            </div>

            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
              ⬅ Dashboard
            </Link>
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="d-flex gap-2 mb-4">
          <button
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${
              filter === "ALL" ? "btn-dark" : "btn-light border"
            }`}
            onClick={() => setFilter("ALL")}
          >
            All ({transactions.length})
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${
              filter === "DEBIT" ? "btn-danger" : "btn-light border"
            }`}
            onClick={() => setFilter("DEBIT")}
          >
            Debited 💸 ({transactions.filter((t) => t.type === "DEBIT").length})
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${
              filter === "CREDIT" ? "btn-success" : "btn-light border"
            }`}
            onClick={() => setFilter("CREDIT")}
          >
            Credited 💰 (
            {transactions.filter((t) => t.type === "CREDIT" || t.type === "ADMIN_DEPOSIT").length})
          </button>
        </div>

        {/* TRANSACTION LIST */}
        {isLoading ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="alert alert-info text-center py-5 rounded-4 shadow-sm">
            <h5>No transactions found</h5>
            <p className="text-muted small mb-3">You haven't made any transactions under this filter yet.</p>
            <Link to="/transfer" className="btn btn-sm btn-primary-gradient px-3">
              Make a Transfer
            </Link>
          </div>
        ) : viewMode === "CARDS" ? (
          /* PHONEPE / UPI STYLE CARDS VIEW */
          <div className="d-flex flex-column gap-3">
            {filteredTransactions.map((tx) => {
              const isDebit = tx.type === "DEBIT";
              const isAdminDeposit = tx.type === "ADMIN_DEPOSIT";
              const title = isDebit
                ? `Paid to ${tx.receiverName || "Account " + tx.toAccount}`
                : isAdminDeposit
                ? "Bank Admin Deposit"
                : `Received from ${tx.senderName || "Account " + tx.fromAccount}`;

              const counterpartyAccount = isDebit ? tx.toAccount : tx.fromAccount;

              return (
                <div
                  key={tx.id}
                  className="card shadow-sm border-0 rounded-3 p-3 bg-white hover-shadow transition"
                  style={{ borderLeft: `5px solid ${isDebit ? "#e74c3c" : "#2ecc71"}` }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      {/* AVATAR / ICON */}
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                        style={{
                          width: "46px",
                          height: "46px",
                          backgroundColor: isDebit ? "#f8d7da" : "#d4edda",
                          color: isDebit ? "#721c24" : "#155724",
                          fontSize: "20px",
                        }}
                      >
                        {isDebit ? "↗" : "↙"}
                      </div>

                      {/* DETAILS */}
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: "#2c3e50" }}>
                          {title}
                        </h6>
                        <div className="text-muted small mt-1">
                          A/C: <span className="font-monospace">{counterpartyAccount || "SecureBank"}</span>
                          {tx.referenceId && (
                            <span className="ms-2">
                              • Ref: <span className="text-secondary">{tx.referenceId}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-muted small">
                          {tx.transactionDate ? formatDate(tx.transactionDate) : "Recent"}
                        </div>
                      </div>
                    </div>

                    {/* AMOUNT & CHARGES */}
                    <div className="text-end">
                      <div
                        className={`fs-5 fw-bold ${
                          isDebit ? "text-danger" : "text-success"
                        }`}
                      >
                        {isDebit ? "-" : "+"} ₹{" "}
                        {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>

                      {isDebit && (
                        <div className="small text-muted">
                          Charge: ₹{(tx.fee || 0.5).toFixed(2)}
                          {tx.tax ? ` + ₹${tx.tax.toFixed(2)} tax` : ""}
                        </div>
                      )}

                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mt-1 small">
                        {tx.status || "SUCCESS"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CLASSIC TABLE VIEW */
          <div className="card shadow-card overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle text-center mb-0">
                  <thead style={{ background: "#2c5364", color: "white" }}>
                    <tr>
                      <th className="py-3">Type</th>
                      <th className="py-3">Details</th>
                      <th className="py-3">From A/C</th>
                      <th className="py-3">To A/C</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Fee / Tax</th>
                      <th className="py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          {tx.type === "CREDIT" && (
                            <span className="badge badge-credit px-2 py-1">CREDIT</span>
                          )}
                          {tx.type === "DEBIT" && (
                            <span className="badge badge-debit px-2 py-1">DEBIT</span>
                          )}
                          {tx.type === "ADMIN_DEPOSIT" && (
                            <span className="badge badge-admin px-2 py-1">ADMIN</span>
                          )}
                        </td>
                        <td className="text-start">
                          <div className="fw-semibold">
                            {tx.type === "DEBIT"
                              ? `To: ${tx.receiverName || "Receiver"}`
                              : `From: ${tx.senderName || "Sender"}`}
                          </div>
                          <small className="text-muted font-monospace">{tx.referenceId}</small>
                        </td>
                        <td className="font-monospace small">{tx.fromAccount || "-"}</td>
                        <td className="font-monospace small">{tx.toAccount || "-"}</td>
                        <td
                          className={`fw-bold ${
                            tx.type === "DEBIT" ? "text-danger" : "text-success"
                          }`}
                        >
                          {tx.type === "DEBIT" ? "-" : "+"} ₹{" "}
                          {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="small text-muted">
                          {tx.type === "DEBIT" ? `₹${(tx.fee || 0.5).toFixed(2)}` : "—"}
                        </td>
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
      </div>

      <Footer />
    </div>
  );
};
