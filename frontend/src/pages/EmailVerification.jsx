import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resend(event) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post("/email/resend-verification", { email: email.trim().toLowerCase() });
      setMessage(response?.data?.message || "If the account needs verification, a new link has been sent.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to resend the verification email.");
    } finally {
      setSending(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">DONO School ERP</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Verify your email address</h1><p className="mt-3 text-sm leading-6 text-slate-600">We sent a verification link to your email address. Open that link before signing in. Check your spam or promotions folder if you do not see it shortly.</p>{error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{message && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={resend} className="mt-6 space-y-3"><label className="block text-sm font-semibold text-slate-700">Account email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" /></label><button type="submit" disabled={sending} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{sending ? "Sending..." : "Resend verification email"}</button></form><button type="button" onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)} className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Back to sign in</button></div></div>;
}
