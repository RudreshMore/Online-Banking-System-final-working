import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service.js";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setIsLoading(true);

    try {
      const response = await authService.register({
        name,
        mobileNumber,
        email,
        password,
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
        style={{ maxWidth: "440px" }}
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
              Full Name
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

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Mobile Number
            </label>
            <input
              type="text"
              className="form-control py-2"
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Email
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

          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold" style={{ fontSize: "14px" }}>
              Password
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
