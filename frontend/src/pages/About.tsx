import React from "react";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";

export const About: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="container mt-5 pt-5 mb-5">
        <div className="card shadow-card p-5 mt-4">
          <h2 className="fw-bold mb-4">About SecureBank</h2>
          <p className="lead text-secondary">
            SecureBank is a modern digital banking platform offering secure and seamless financial services.
          </p>
          <hr className="my-4" />
          <p className="text-secondary">
            Designed to simulate real-world modern financial technology, SecureBank delivers end-to-end account management, robust authentication, atomic financial transfers, and real-time transaction reporting.
          </p>
          <p className="text-secondary">
            Built with React, TypeScript, Express, Prisma, and MySQL for enterprise scalability and reliable performance.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};
