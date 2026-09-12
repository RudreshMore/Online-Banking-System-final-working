import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service.js";
import { transactionService } from "../services/transaction.service.js";
import { Account } from "../types/index.js";

export const Transfer: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAccount, setIsFetchingAccount] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountService.getMyAccount();
        if (res.data) {
          setAccount(res.data);
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || "Could not load your account details");
      } finally {
        setIsFetchingAccount(false);
      }
    };

    fetchAccount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Invalid transfer amount");
      return;
    }

    if (account && toAccount.trim() === account.accountNumber) {
      setErrorMessage("Sender and receiver cannot be same");
      return;
    }

    if (account && account.balance < parsedAmount) {
      setErrorMessage("Insufficient balance");
      return;
    }

    setIsLoading(true);

    try {
      const res = await transactionService.transfer({
        toAccount: toAccount.trim(),
        amount: parsedAmount,
      });

      if (res.success) {
        navigate("/dashboard?transferSuccess=true", { replace: true });
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || "Transfer failed. Please try again.";
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 px-3 py-5"
      style={{
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      }}
    >
      <div
        className="bg-white p-4 p-md-5 rounded-4 shadow-lg w-100"
        style={{ maxWidth: "450px" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ color: "#2c5364" }}>
            SecureBank
          </h1>
          <span className="text-muted" style={{ fontSize: "14px" }}>
            Fast • Secure • Reliable Transfers
          </span>
        </div>

        {errorMessage && (
          <div className="alert alert-danger py-2 text-center" style={{ fontSize: "13px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              From Account
            </label>
            <input
              type="text"
              className="form-control py-2 bg-light"
              value={isFetchingAccount ? "Loading..." : account?.accountNumber || ""}
              readOnly
            />
            {account && (
              <div className="text-muted text-end mt-1" style={{ fontSize: "12px" }}>
                Balance: ₹ {account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              To Account Number
            </label>
            <input
              type="text"
              className="form-control py-2"
              placeholder="Enter receiver account number"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Amount (₹)
            </label>
            <input
              type="number"
              className="form-control py-2"
              placeholder="Enter amount"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient w-100 py-2 fw-semibold"
            disabled={isLoading || isFetchingAccount}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : null}
            {isLoading ? "Processing Transfer..." : "Transfer Money"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/dashboard" className="text-decoration-none" style={{ color: "#2c5364", fontSize: "14px" }}>
            ⬅ Back to Dashboard
          </Link>
        </div>

        <div className="text-center text-muted mt-4" style={{ fontSize: "12px" }}>
          © 2026 SecureBank <br />
          Designed & Developed by <strong>Rudresh Narayan More</strong>
        </div>
      </div>
    </div>
  );
};
