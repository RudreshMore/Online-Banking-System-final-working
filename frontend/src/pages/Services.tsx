import React from "react";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";

export const Services: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="container mt-5 pt-5 mb-5">
        <div className="card shadow-card p-5 mt-4">
          <h2 className="fw-bold mb-4">Our Services</h2>
          <ul className="list-group list-group-flush fs-5">
            <li className="list-group-item py-3">💰 <strong>Online Money Transfer</strong> — Instant peer-to-peer transfers with real-time balance validation.</li>
            <li className="list-group-item py-3">📊 <strong>Account Management</strong> — Automated bank account provisioning and balance tracking.</li>
            <li className="list-group-item py-3">🧾 <strong>Transaction History</strong> — Complete chronological dual-entry debit and credit ledger.</li>
            <li className="list-group-item py-3">👨‍💼 <strong>Admin Banking Control</strong> — Direct administrative deposits, customer status toggling, and audit trails.</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};
