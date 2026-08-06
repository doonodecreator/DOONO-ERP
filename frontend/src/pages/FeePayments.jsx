import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

export default function FeePayments() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Verifying your payment with Paystack...");

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setSuccess(false);
      setMessage("No payment reference found.");
      return;
    }

    async function verifyPayment() {
      try {
        const response = await api.get(`/payments/paystack/verify/${reference}`);
        if (response.data.success) {
          setSuccess(true);
          setMessage("Payment was successful! Your ledger has been updated.");
        } else {
          setSuccess(false);
          setMessage("Payment verification failed or is still pending.");
        }
      } catch (err) {
        setSuccess(false);
        setMessage(err?.response?.data?.message || "An error occurred while verifying payment.");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [reference]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow border-0 text-center p-4">
            <div className="card-body">
              {loading ? (
                <div>
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <h4>Processing Payment...</h4>
                  <p className="text-muted">{message}</p>
                </div>
              ) : success ? (
                <div>
                  <div className="mb-3 text-success" style={{ fontSize: "50px" }}>
                    <i className="fa fa-check-circle"></i>
                  </div>
                  <h3 className="text-success font-weight-bold">Payment Successful!</h3>
                  <p className="text-muted mb-4">{message}</p>
                  {reference && (
                    <p className="small text-secondary mb-4">Transaction Reference: <code>{reference}</code></p>
                  )}
                  <Link to="/dashboard" className="btn btn-primary px-4 py-2 font-weight-bold">
                    Return to Dashboard
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-3 text-danger" style={{ fontSize: "50px" }}>
                    <i className="fa fa-times-circle"></i>
                  </div>
                  <h3 className="text-danger font-weight-bold">Verification Failed</h3>
                  <p className="text-muted mb-4">{message}</p>
                  <Link to="/dashboard" className="btn btn-outline-secondary px-4 py-2">
                    Back to Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

