import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { useAuth } from "../context/AuthContext.js";
import { userService } from "../services/user.service.js";
import { kycService } from "../services/kyc.service.js";
import { User, ProfileUpdateRequest } from "../types/index.js";
import { formatDate } from "../utils/index.js";

export const Profile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(authUser);
  const [kycRequests, setKycRequests] = useState<ProfileUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAadhaar, setNewAadhaar] = useState("");
  const [newDob, setNewDob] = useState("");
  const [reason, setReason] = useState("");
  const [proofDoc, setProofDoc] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfileAndKyc = async () => {
    try {
      const [profileRes, kycRes] = await Promise.all([
        userService.getProfile(),
        kycService.getMyRequests(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      if (kycRes.data) {
        setKycRequests(kycRes.data);
      }
    } catch (err) {
      console.error("Failed to load profile or KYC requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndKyc();
  }, []);

  const handleSubmitKycRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!newName.trim() && !newAadhaar.trim() && !newDob.trim()) {
      setModalError("Please provide at least one field to update");
      return;
    }

    if (newAadhaar.trim() && !/^\d{12}$/.test(newAadhaar.trim())) {
      setModalError("Aadhaar Number must be exactly 12 digits");
      return;
    }

    if (reason.trim().length < 5) {
      setModalError("Please explain why you need to update this information (min 5 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestedChanges: any = {};
      if (newName.trim()) requestedChanges.name = newName.trim();
      if (newAadhaar.trim()) requestedChanges.aadhaarNumber = newAadhaar.trim();
      if (newDob.trim()) requestedChanges.dob = newDob.trim();

      const res = await kycService.submitRequest({
        requestedChanges,
        reason: reason.trim(),
        proofDocument: proofDoc.trim() || undefined,
      });

      if (res.success) {
        setModalSuccess(res.message || "Request submitted to Bank Admin!");
        setNewName("");
        setNewAadhaar("");
        setNewDob("");
        setReason("");
        setProofDoc("");
        // Reload KYC list
        fetchProfileAndKyc();
        setTimeout(() => {
          setShowRequestModal(false);
          setModalSuccess("");
        }, 1800);
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to submit KYC request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstLetter = profile?.name ? profile.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="container py-4 my-3" style={{ maxWidth: "880px" }}>
        {/* COMPLIANCE ALERT */}
        <div
          className="alert bg-white border-0 shadow-sm p-3 mb-4 rounded-3 d-flex align-items-center gap-3"
          style={{ borderLeft: "5px solid #2c5364" }}
        >
          <div className="fs-2 text-primary">🛡️</div>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: "#2c5364" }}>
              Strict Banking Security & KYC Policy
            </h6>
            <p className="small text-muted mb-0">
              For regulatory compliance and fraud protection, core identity details (Name, Aadhaar, DOB) cannot be directly modified. To request changes, submit a request with proof to the Bank Admin for verification.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* PROFILE CARD */}
          <div className="col-md-6">
            <div className="card shadow-card overflow-hidden h-100">
              {/* PROFILE HEADER */}
              <div
                className="text-white text-center py-4 px-3"
                style={{ background: "linear-gradient(135deg, #0f2027, #2c5364)" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#ffffff",
                    color: "#2c5364",
                    fontSize: "30px",
                    fontWeight: 600,
                  }}
                >
                  {firstLetter}
                </div>
                <h4 className="fw-bold mb-1">{profile?.name || "User Name"}</h4>
                <small className="text-white-50">{profile?.email || "email@example.com"}</small>
              </div>

              {/* PROFILE BODY */}
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="text-muted small">Full Legal Name</label>
                  <p className="fs-6 fw-semibold mb-0">{profile?.name}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted small">Email Address</label>
                  <p className="fs-6 fw-semibold mb-0">{profile?.email}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted small">Mobile Number</label>
                  <p className="fs-6 fw-semibold mb-0">{profile?.mobileNumber || "Not Provided"}</p>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="text-muted small">Account Type</label>
                    <p className="fs-6 fw-bold mb-0 text-primary">
                      {profile?.account?.accountType || "SAVINGS"}
                    </p>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small">Account Number</label>
                    <p className="fs-6 fw-bold font-monospace mb-0">
                      {profile?.account?.accountNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="text-muted small">Aadhaar Number</label>
                    <p className="fs-6 fw-semibold mb-0">
                      {profile?.aadhaarNumber
                        ? `•••• •••• ${profile.aadhaarNumber.slice(-4)}`
                        : "Not Linked"}
                    </p>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small">Date of Birth</label>
                    <p className="fs-6 fw-semibold mb-0">{profile?.dob || "Not Provided"}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-muted small">Account Status</label>
                  <div>
                    {profile?.active ? (
                      <span className="badge bg-success px-3 py-1">ACTIVE</span>
                    ) : (
                      <span className="badge bg-danger px-3 py-1">BLOCKED</span>
                    )}
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="btn btn-primary-gradient py-2 fw-semibold shadow-sm"
                  >
                    📝 Request Profile / KYC Update
                  </button>
                  <Link to="/dashboard" className="btn btn-outline-secondary py-2">
                    ⬅ Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* REQUEST AUDIT TRAIL */}
          <div className="col-md-6">
            <div className="card shadow-card h-100 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0" style={{ color: "#2c5364" }}>
                  My KYC Requests
                </h5>
                <span className="badge bg-light text-dark border">
                  {kycRequests.length} Total
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : kycRequests.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-2">📋</div>
                  <p className="small mb-2">No profile update requests submitted yet.</p>
                  <p className="small text-muted">
                    If you need to correct your Name, Aadhaar, or Date of Birth, click "Request Profile / KYC Update".
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: "480px" }}>
                  {kycRequests.map((req) => {
                    const isPending = req.status === "PENDING";
                    const isApproved = req.status === "APPROVED";
                    const isRejected = req.status === "REJECTED";

                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-3 border"
                        style={{
                          borderLeft: `4px solid ${
                            isApproved ? "#27ae60" : isRejected ? "#e74c3c" : "#f39c12"
                          }`,
                          background: isPending ? "#fffcf5" : "#ffffff",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="small text-muted font-monospace">
                            Request #{req.id} • {formatDate(req.createdAt)}
                          </span>
                          <span
                            className={`badge ${
                              isApproved
                                ? "bg-success"
                                : isRejected
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="small fw-semibold mt-2">Requested Changes:</div>
                        <ul className="small mb-2 ps-3 text-secondary">
                          {req.requestedChanges.name && (
                            <li>Name: <strong>{req.requestedChanges.name}</strong></li>
                          )}
                          {req.requestedChanges.aadhaarNumber && (
                            <li>Aadhaar: <strong>{req.requestedChanges.aadhaarNumber}</strong></li>
                          )}
                          {req.requestedChanges.dob && (
                            <li>DOB: <strong>{req.requestedChanges.dob}</strong></li>
                          )}
                        </ul>

                        <div className="small text-muted">
                          <strong>Reason:</strong> {req.reason}
                        </div>

                        {req.adminComment && (
                          <div
                            className={`small mt-2 p-2 rounded ${
                              isApproved ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                            }`}
                          >
                            <strong>Admin Note:</strong> {req.adminComment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT KYC REQUEST MODAL */}
      {showRequestModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px" }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="p-4 text-white text-center"
                style={{ background: "linear-gradient(135deg, #0f2027, #2c5364)" }}
              >
                <h4 className="fw-bold mb-1">Submit KYC Change Request</h4>
                <p className="small text-white-50 mb-0">
                  Provide new details and explanation for Admin approval
                </p>
              </div>

              <div className="p-4 bg-white">
                {modalError && (
                  <div className="alert alert-danger py-2 small mb-3">{modalError}</div>
                )}
                {modalSuccess && (
                  <div className="alert alert-success py-2 small mb-3">{modalSuccess}</div>
                )}

                <form onSubmit={handleSubmitKycRequest}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">
                      New Full Name (leave blank if unchanged)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rudresh Narayan More"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-7">
                      <label className="form-label text-secondary small fw-semibold">
                        New 12-Digit Aadhaar Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="12 digits"
                        maxLength={12}
                        value={newAadhaar}
                        onChange={(e) => setNewAadhaar(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label text-secondary small fw-semibold">
                        New Date of Birth
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={newDob}
                        onChange={(e) => setNewDob(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">
                      Proof Document URL or Note *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Link to Aadhaar scan or ID reference"
                      value={proofDoc}
                      onChange={(e) => setProofDoc(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-secondary small fw-semibold">
                      Reason for Change Request *
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Explain why this correction/change is needed (e.g., spelling mismatch on official Aadhaar card)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-light w-50 py-2"
                      onClick={() => setShowRequestModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient w-50 py-2 fw-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit to Admin"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
