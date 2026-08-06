import { useState } from "react";
import api from "../services/api";

export default function FeePaymentModal({ isOpen, onClose, studentId, feeCategoryId, feeName, amount }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handlePayment() {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/payments/paystack/initialize", {
        student_id: studentId,
        amount: amount,
        fee_category_id: feeCategoryId,
      });

      const authUrl = response?.data?.data?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setError("Could not retrieve payment authorization URL.");
        setLoading(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to initialize payment.");
      setLoading(false);
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-white py-3">
            <h5 className="modal-title font-weight-bold text-primary" style={{ fontSize: "18px" }}>
              Secure Online Fee Payment
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body p-4">
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            
            <div className="mb-3">
              <span className="text-muted small d-block">Fee Description</span>
              <strong className="text-dark" style={{ fontSize: "16px" }}>{feeName || "School Fee Payment"}</strong>
            </div>

            <div className="mb-4 bg-light p-3 rounded">
              <span className="text-muted small d-block">Total Payable Amount</span>
              <h3 className="text-success font-weight-bold mb-0">₦{Number(amount || 0).toLocaleString()}</h3>
            </div>

            <div className="alert alert-info small mb-0">
              You will be redirected to Paystack to complete your payment securely. Funds will route directly to the school's designated account.
            </div>
          </div>
          <div className="modal-footer bg-white py-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 font-weight-bold"
              onClick={handlePayment}
              disabled={loading}
              style={{ background: "#2563eb", border: "none" }}
            >
              {loading ? "Initializing..." : "Proceed to Paystack"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
