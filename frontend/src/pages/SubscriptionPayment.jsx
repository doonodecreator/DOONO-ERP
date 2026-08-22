import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionPayment() {
  const [searchParams] = useSearchParams();
  const { refreshContext } = useAuth();
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Confirming your subscription payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      setStatus("error");
      setMessage("No Paystack payment reference was provided.");
      return;
    }

    let active = true;
    api.get(`/payments/verify-subscription/${encodeURIComponent(reference)}`)
      .then(async (response) => {
        if (!active) return;
        await refreshContext?.();
        setStatus("success");
        setMessage(response?.data?.message || "Subscription payment verified and activated.");
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(error?.response?.data?.message || "Payment could not be verified yet. Do not pay again immediately; check your Paystack receipt or contact the platform owner.");
      });

    return () => {
      active = false;
    };
  }, [refreshContext, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Subscription payment</h1>
        <p className={`mt-4 text-sm ${status === "error" ? "text-rose-700" : status === "success" ? "text-emerald-700" : "text-slate-600"}`}>{message}</p>
        {status !== "checking" && <Link to="/" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Return to dashboard</Link>}
      </div>
    </div>
  );
}
