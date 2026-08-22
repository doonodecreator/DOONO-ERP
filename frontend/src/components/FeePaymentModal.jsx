import { useState } from "react";
import api from "../services/api";
import Modal from "./modals/Modal";
import Button from "./forms/Button";
import Alert from "./feedback/Alert";

export default function FeePaymentModal({ isOpen, onClose, studentId, studentFeeId, feeCategoryId, feeName, amount }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/payments/paystack/initialize", {
        student_id: studentId,
        amount,
        fee_category_id: feeCategoryId,
        student_fee_id: studentFeeId,
      });
      const authUrl = response?.data?.data?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setError("Could not retrieve payment authorization URL.");
        setLoading(false);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to initialize payment.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={loading ? undefined : onClose}
      title="Secure online fee payment"
      description="You will be redirected to Paystack to complete this payment securely."
      size="md"
      footer={<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button onClick={handlePayment} loading={loading}>Proceed to Paystack</Button></div>}
    >
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-4">
        <div>
          <p className="ui-form-label">Fee description</p>
          <p className="text-base font-semibold text-slate-900">{feeName || "School fee payment"}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total payable amount</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">₦{Number(amount || 0).toLocaleString()}</p>
        </div>
        <p className="text-sm text-slate-600">The payment will be attached to this exact student fee invoice. If your connection drops after authorization, you can safely return to the payment page and verify the same reference without creating a duplicate ledger entry.</p>
      </div>
    </Modal>
  );
}
