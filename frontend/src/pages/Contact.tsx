import React from "react";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";

export const Contact: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="container mt-5 pt-5 mb-5">
        <div className="card shadow-card p-5 mt-4">
          <h2 className="fw-bold mb-4">Contact Us</h2>
          <div className="fs-5 text-secondary">
            <p className="mb-3">
              📧 <strong>Email Support:</strong>{" "}
              <a href="mailto:support@mybank.com" className="text-decoration-none text-primary">
                support@mybank.com
              </a>
            </p>
            <p className="mb-3">
              📞 <strong>Phone Support:</strong>{" "}
              <a href="tel:+919876543210" className="text-decoration-none text-primary">
                +91 9876543210
              </a>
            </p>
            <hr className="my-4" />
            <h5 className="fw-bold">Developer Contact & Credits</h5>
            <p className="mb-1"><strong>Rudresh Narayan More</strong></p>
            <p className="mb-1">Mobile: +91 9110803342</p>
            <p className="mb-0">Email: rudreshmore@gmail.com</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
