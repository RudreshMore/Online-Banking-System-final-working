import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { transactionService } from "../services/transaction.service.js";
import { Transaction } from "../types/index.js";
import { formatDate } from "../utils/index.js";

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="container py-5 my-3 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold" style={{ color: "#2c5364" }}>
            Transaction History
          </h3>
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            ⬅ Dashboard
          </Link>
        </div>

        <div className="card shadow-card overflow-hidden">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="alert alert-info text-center m-4 py-4">
                No transactions found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle text-center mb-0">
                  <thead style={{ background: "#2c5364", color: "white" }}>
                    <tr>
                      <th className="py-3">#</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">From Account</th>
                      <th className="py-3">To Account</th>
                      <th className="py-3">Amount (₹)</th>
                      <th className="py-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td>{idx + 1}</td>
                        <td>
                          {tx.type === "CREDIT" && (
                            <span className="badge badge-credit px-3 py-2">CREDIT</span>
                          )}
                          {tx.type === "DEBIT" && (
                            <span className="badge badge-debit px-3 py-2">DEBIT</span>
                          )}
                          {tx.type === "ADMIN_DEPOSIT" && (
                            <span className="badge badge-admin px-3 py-2">ADMIN</span>
                          )}
                          {tx.type !== "CREDIT" &&
                            tx.type !== "DEBIT" &&
                            tx.type !== "ADMIN_DEPOSIT" && (
                              <span className="badge bg-secondary px-3 py-2">{tx.type}</span>
                            )}
                        </td>
                        <td>{tx.fromAccount || "-"}</td>
                        <td>{tx.toAccount || "-"}</td>
                        <td className="fw-bold fs-6">
                          ₹ {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-muted">
                          {tx.transactionDate ? formatDate(tx.transactionDate) : "-"}
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
