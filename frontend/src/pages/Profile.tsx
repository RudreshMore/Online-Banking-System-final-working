import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { useAuth } from "../context/AuthContext.js";
import { userService } from "../services/user.service.js";
import { User } from "../types/index.js";

export const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile();
        if (res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const firstLetter = profile?.name ? profile.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="container py-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-6">
            <div className="card shadow-card overflow-hidden">
              {/* PROFILE HEADER */}
              <div
                className="text-white text-center py-4 px-3"
                style={{ background: "linear-gradient(135deg, #0f2027, #2c5364)" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{
                    width: "84px",
                    height: "84px",
                    backgroundColor: "#ffffff",
                    color: "#2c5364",
                    fontSize: "32px",
                    fontWeight: 600,
                  }}
                >
                  {firstLetter}
                </div>
                <h4 className="fw-bold mb-1">{profile?.name || "User Name"}</h4>
                <small className="text-white-50">{profile?.email || "email@example.com"}</small>
              </div>

              {/* PROFILE BODY */}
              <div className="card-body p-4 p-md-5">
                <div className="mb-3">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Full Name
                  </label>
                  <p className="fs-5 fw-semibold mb-0">{profile?.name}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Email Address
                  </label>
                  <p className="fs-5 fw-semibold mb-0">{profile?.email}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Mobile Number
                  </label>
                  <p className="fs-5 fw-semibold mb-0">{profile?.mobileNumber || "Not Provided"}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Account Number
                  </label>
                  <p className="fs-5 fw-semibold mb-0">
                    {profile?.account?.accountNumber || "—"}
                  </p>
                </div>

                <div className="mb-3">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Current Balance
                  </label>
                  <p className="fs-4 fw-bold text-success mb-0">
                    ₹{" "}
                    {isLoading
                      ? "..."
                      : profile?.account?.balance
                      ? profile.account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                      : "0.00"}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-muted" style={{ fontSize: "13px" }}>
                    Account Status
                  </label>
                  <div>
                    {profile?.active ? (
                      <span className="badge bg-success px-3 py-2 fs-6">ACTIVE</span>
                    ) : (
                      <span className="badge bg-danger px-3 py-2 fs-6">BLOCKED</span>
                    )}
                  </div>
                </div>

                <div className="text-center pt-3 border-top">
                  <Link to="/dashboard" className="btn btn-outline-secondary px-4">
                    ⬅ Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
