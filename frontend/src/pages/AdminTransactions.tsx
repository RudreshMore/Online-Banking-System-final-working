import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { transactionService } from "../services/transaction.service.js";
import { Transaction } from "../types/index.js";
import { formatDate } from "../utils/index.js";

export const AdminTransactions: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targetUserName, setTargetUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        if (userId) {
          const res = await transactionService.getUserTransactions(parseInt(userId, 10));
          if (res.data) {
            setTransactions(res.data.transactions);
            setTargetUserName(res.data.user.name);
          }
        } else {
          const res = await transactionService.getAllTransactions();
          if (res.data) {
            setTransactions(res.data);
            setTargetUserName(null);
          }
        }
      } catch (err) {
        console.error("Failed to load admin transactions", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  const getDescription = (type: string) => {
    switch (type) {
      case "ADMIN_DEPOSIT":
        return "Admin Deposit";
      case "DEBIT":
        return "Money Sent";
      case "CREDIT":
        return "Money Received";
      default:
        return type;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "ADMIN_DEPOSIT":
        return "bg-primary";
      case "CREDIT":
        return "bg-success";
      case "DEBIT":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="container py-4 my-3 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0" style={{ color: "#2c5364" }}>
            📄 {targetUserName ? `Transaction History for ${targetUserName}` : "All System Transactions"}
          </h4>
          <Link to="/admin/dashboard" className="btn btn-secondary btn-sm px-3">
            ⬅ Back to Admin Dashboard
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
                <table className="table table-bordered table-hover align-middle text-center mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th className="py-3">#</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">Description</th>
                      <th className="py-3">From</th>
                      <th className="py-3">To</th>
                      <th className="py-3">Amount (₹)</th>
                      <th className="py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(tx.type)} px-3 py-2`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="fw-semibold">{getDescription(tx.type)}</td>
                        <td>{tx.fromAccount || "ADMIN"}</td>
                        <td>{tx.toAccount || "—"}</td>
                        <td className="fw-bold">
                          ₹ {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-muted">
                          {tx.transactionDate ? formatDate(tx.transactionDate) : "—"}
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
