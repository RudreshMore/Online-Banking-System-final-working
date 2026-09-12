import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";

export const Home: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      {/* HERO SECTION */}
      <section className="py-5 mt-5" style={{ background: "#eef2ff", minHeight: "85vh", display: "flex", alignItems: "center" }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-md-6">
              <h1 className="display-4 fw-bold text-dark">
                A Smarter Way to <span style={{ color: "#4f46e5" }}>Bank Digitally</span>
              </h1>
              <p className="lead mt-3 text-secondary">
                SecureBank is a modern online banking platform that allows users to manage accounts, transfer money, and track transactions securely — anytime, anywhere.
              </p>
              <div className="d-flex gap-3 mt-4">
                <Link to="/register" className="btn btn-success btn-lg px-4 py-3 shadow">
                  Open an Account
                </Link>
                <Link to="/login" className="btn btn-primary-gradient btn-lg px-4 py-3 shadow">
                  Online Banking Login
                </Link>
              </div>
            </div>

            <div className="col-md-6 text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3050/3050525.png"
                alt="Digital Banking"
                className="img-fluid"
                style={{ maxHeight: "380px" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHY SECUREBANK SECTION */}
      <section id="why" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold fs-1">Why SecureBank?</h2>
            <p className="text-muted mt-2">
              Built with security, performance, and real-world banking needs in mind.
            </p>
          </div>

          <div className="row g-5 align-items-center">
            <div className="col-md-6">
              <p className="fs-5 text-secondary">
                SecureBank is designed as a full-stack digital banking system that follows real banking workflows. Users can register, receive an automatically generated bank account, and start transactions instantly with an opening balance.
              </p>
              <p className="fs-5 text-secondary">
                The system ensures strong authentication, role-based access (Admin & User), secure password encryption, and real-time transaction tracking.
              </p>
              <p className="fs-5 text-secondary">
                Admin users can manage all customer accounts, monitor transactions, activate or block users, and perform deposits — making SecureBank suitable for real-world banking workflows.
              </p>
            </div>

            <div className="col-md-6">
              <div className="card shadow-card p-4 mb-3">
                <div className="fs-2 mb-2">🔐</div>
                <h5 className="fw-bold">Enterprise-Grade Security</h5>
                <p className="text-muted mb-0">JWT authentication, bcrypt password encryption, and role-based access control.</p>
              </div>

              <div className="card shadow-card p-4 mb-3">
                <div className="fs-2 mb-2">⚡</div>
                <h5 className="fw-bold">Fast & Reliable</h5>
                <p className="text-muted mb-0">Modern backend with Node.js, Express, TypeScript, and Prisma ORM.</p>
              </div>

              <div className="card shadow-card p-4">
                <div className="fs-2 mb-2">📈</div>
                <h5 className="fw-bold">Real-Time Banking</h5>
                <p className="text-muted mb-0">Instant atomic balance updates, dual-entry debit/credit ledger, and transaction history.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-5" style={{ background: "#f8f9fb" }}>
        <div className="container text-center py-4">
          <h2 className="fw-bold mb-5 fs-1">Our Services</h2>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card shadow-card p-4 h-100">
                <div className="fs-1 mb-3">🏦</div>
                <h5 className="fw-bold">Account Management</h5>
                <p className="text-muted">Create and manage digital bank accounts with initial bonus balance and real-time health monitoring.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-card p-4 h-100">
                <div className="fs-1 mb-3">💸</div>
                <h5 className="fw-bold">Money Transfer</h5>
                <p className="text-muted">Instant, secure fund transfers between bank accounts protected by atomic database transactions.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-card p-4 h-100">
                <div className="fs-1 mb-3">🛡</div>
                <h5 className="fw-bold">Admin Control</h5>
                <p className="text-muted">Complete administrative oversight, customer deposit management, blocking & transaction audits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
