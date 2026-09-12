import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service.js";
import { transactionService } from "../services/transaction.service.js";
import { Account } from "../types/index.js";

export const Transfer: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [mpin, setMpin] = useState<string>("");
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

  // Settlement calculations
  const parsedAmount = parseFloat(amount) || 0;
  const isCurrent = account?.accountType === "CURRENT";
  const fee = parsedAmount > 0 ? 0.5 : 0.0;
  const tax = isCurrent && parsedAmount > 0 ? 0.09 : 0.0;
  const totalDebit = Number((parsedAmount + fee + tax).toFixed(2));
  const availableBalance = account ? Number(account.balance) : 0;
  const isInsufficient = parsedAmount > 0 && totalDebit > availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (parsedAmount <= 0) {
      setErrorMessage("Invalid transfer amount");
      return;
    }

    if (account && toAccount.trim() === account.accountNumber) {
      setErrorMessage("Sender and receiver cannot be same");
      return;
    }

    if (isInsufficient) {
      setErrorMessage(
        `Insufficient balance: Transfer of ₹${parsedAmount.toFixed(2)} + ₹${fee.toFixed(2)} fee requires ₹${totalDebit.toFixed(2)}, but your available balance is ₹${availableBalance.toFixed(2)}`
      );
      return;
    }

    if (!/^\d{4}$/.test(mpin)) {
      setErrorMessage("Please enter your 4-digit Security MPIN");
      return;
    }

    setIsLoading(true);

    try {
      const res = await transactionService.transfer({
        toAccount: toAccount.trim(),
        amount: parsedAmount,
        mpin,
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
        style={{ maxWidth: "480px" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ color: "#2c5364" }}>
            SecureBank
          </h1>
          <span className="text-muted" style={{ fontSize: "14px" }}>
            Fast • Secure • UPI-Grade Transfers
          </span>
        </div>

        {errorMessage && (
          <div className="alert alert-danger py-2 text-center" style={{ fontSize: "13px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: "14px" }}>
                From Account ({account?.accountType || "SAVINGS"})
              </label>
              <span className="badge bg-light text-secondary border">
                Balance: ₹ {availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <input
              type="text"
              className="form-control py-2 bg-light"
              value={isFetchingAccount ? "Loading..." : account?.accountNumber || ""}
              readOnly
            />
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

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Transfer Amount (₹)
            </label>
            <input
              type="number"
              className="form-control py-2"
              placeholder="Enter amount (e.g. 10)"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* SETTLEMENT BREAKDOWN */}
          {parsedAmount > 0 && (
            <div
              className={`p-3 rounded-3 mb-3 ${
                isInsufficient ? "bg-danger-subtle border border-danger" : "bg-light border"
              }`}
            >
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary">Transfer Amount:</span>
                <span className="fw-semibold">₹ {parsedAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary">Platform Charge:</span>
                <span className="fw-semibold">₹ {fee.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-secondary">GST (18% on fee):</span>
                  <span className="fw-semibold">₹ {tax.toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total Debit Required:</span>
                <span className={isInsufficient ? "text-danger" : "text-dark"}>
                  ₹ {totalDebit.toFixed(2)}
                </span>
              </div>

              {isInsufficient && (
                <div className="text-danger small mt-2 fw-semibold">
                  ⚠️ Insufficient Balance! You need ₹{totalDebit.toFixed(2)}, but you only have ₹{availableBalance.toFixed(2)}.
                  {availableBalance >= 0.5 && (
                    <div className="text-muted fw-normal mt-1">
                      Tip: You can send up to <strong>₹{(availableBalance - fee - tax).toFixed(2)}</strong> to empty your account.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECURITY MPIN INPUT */}
          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Security MPIN (4 digits)
            </label>
            <input
              type="password"
              className="form-control py-2 text-center fs-4 letter-spacing-2"
              placeholder="••••"
              maxLength={4}
              value={mpin}
              onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
              required
            />
            <small className="text-muted text-center d-block mt-1">
              Enter your 4-digit security PIN to authorize debit.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient w-100 py-2 fw-semibold"
            disabled={isLoading || isFetchingAccount || isInsufficient || mpin.length !== 4}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : null}
            {isLoading
              ? "Processing Transfer..."
              : `Pay ₹${totalDebit > 0 ? totalDebit.toFixed(2) : "0.00"}`}
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
