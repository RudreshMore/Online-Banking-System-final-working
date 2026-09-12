import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="py-4 text-center mt-auto" style={{ background: "#1f2937", color: "white" }}>
      <div className="container">
        <p className="mb-1 fw-semibold">
          © 2026 SecureBank • Smart Digital Banking
        </p>
        <p className="mb-2 text-white-50" style={{ fontSize: "14px" }}>
          Designed & Developed by <strong>Rudresh Narayan More</strong>
        </p>
        <p className="mb-2" style={{ fontSize: "13px" }}>
          📞 Mobile:{" "}
          <a href="tel:+919110803342" className="text-info text-decoration-none">
            +91 9110803342
          </a>{" "}
          | 📧 Email:{" "}
          <a href="mailto:rudreshmore@gmail.com" className="text-info text-decoration-none">
            rudreshmore@gmail.com
          </a>
        </p>
        <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: "12px" }}>
          <Link to="/about" className="text-white-50 text-decoration-none">About</Link>
          <Link to="/services" className="text-white-50 text-decoration-none">Services</Link>
          <Link to="/contact" className="text-white-50 text-decoration-none">Contact</Link>
          <Link to="/help" className="text-white-50 text-decoration-none">Help</Link>
        </div>
      </div>
    </footer>
  );
};
