import React from "react";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";

export const Help: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="container mt-5 pt-5 mb-5">
        <div className="card shadow-card p-5 mt-4">
          <h2 className="fw-bold mb-4">Help & Support</h2>
          <p className="fs-5 text-secondary">
            For account or transaction issues, please reach out to our customer support team or email{" "}
            <a href="mailto:support@mybank.com">support@mybank.com</a>.
          </p>
          <div className="alert alert-info mt-4">
            🔒 <strong>Security Reminder:</strong> SecureBank representatives will never ask for your password, OTP, or sensitive credentials over the phone or email.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
