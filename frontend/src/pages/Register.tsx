import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service.js";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"SAVINGS" | "CURRENT">("SAVINGS");
  const [mpin, setMpin] = useState("1234");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [dob, setDob] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side mobile validation (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      setErrorMessage("Mobile number must be exactly 10 digits");
      return;
    }

    if (mpin && !/^\d{4}$/.test(mpin)) {
      setErrorMessage("Security MPIN must be exactly 4 digits");
      return;
    }

    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      setErrorMessage("Aadhaar Number must be exactly 12 digits");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        name,
        mobileNumber,
        email,
        password,
        accountType,
        mpin,
        aadhaarNumber: aadhaarNumber || undefined,
        dob: dob || undefined,
      });

      if (response.success) {
        navigate("/login", {
          state: { successMessage: "Account created successfully! Please login." },
        });
      }
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
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
            Safe • Simple • Smart Banking
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
              Full Name *
            </label>
            <input
              type="text"
              className="form-control py-2"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
                Mobile Number *
              </label>
              <input
                type="text"
                className="form-control py-2"
                placeholder="10-digit mobile"
                pattern="[0-9]{10}"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
                Security MPIN (4-digit) *
              </label>
              <input
                type="password"
                className="form-control py-2"
                placeholder="e.g. 1234"
                maxLength={4}
                value={mpin}
                onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Email Address *
            </label>
            <input
              type="email"
              className="form-control py-2"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Password *
            </label>
            <input
              type="password"
              className="form-control py-2"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ACCOUNT TYPE SELECTION */}
          <div className="mb-3 p-3 rounded-3" style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}>
            <label className="form-label text-secondary fw-semibold mb-2" style={{ fontSize: "14px" }}>
              Choose Account Type
            </label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="accountType"
                  id="typeSavings"
                  value="SAVINGS"
                  checked={accountType === "SAVINGS"}
                  onChange={() => setAccountType("SAVINGS")}
                />
                <label className="form-check-label fw-semibold" htmlFor="typeSavings">
                  Savings A/C
                  <div className="text-muted small fw-normal">₹50k/day limit • Flat ₹0.50 fee</div>
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="accountType"
                  id="typeCurrent"
                  value="CURRENT"
                  checked={accountType === "CURRENT"}
                  onChange={() => setAccountType("CURRENT")}
                />
                <label className="form-check-label fw-semibold" htmlFor="typeCurrent">
                  Current A/C
                  <div className="text-muted small fw-normal">₹5L/day limit • GST Tax applicable</div>
                </label>
              </div>
            </div>
          </div>

          {/* KYC DETAILS */}
          <div className="row g-2 mb-4">
            <div className="col-md-7">
              <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
                Aadhaar Number (Optional)
              </label>
              <input
                type="text"
                className="form-control py-2"
                placeholder="12-digit Aadhaar"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
                Date of Birth
              </label>
              <input
                type="date"
                className="form-control py-2"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient w-100 py-2 fw-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : null}
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-decoration-none" style={{ color: "#2c5364", fontSize: "14px" }}>
            Already have an account? Login
          </Link>
        </div>

        <div className="text-center mt-2">
          <Link to="/" className="text-decoration-none text-muted" style={{ fontSize: "13px" }}>
            ⬅ Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
