import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: searchParams.get("email") || "", token: searchParams.get("token") || "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setFieldErrors({});
    try {
      const response = await api.post("/reset-password", form);
      setMessage(response?.data?.message || "Password reset successfully.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "This reset link is invalid or expired.");
      setFieldErrors(requestError?.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">DONO School ERP</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Create a new password</h1><p className="mt-3 text-sm leading-6 text-slate-600">Use this page only from a reset link sent to your account email. Your reset token is single-use and expires automatically.</p>{error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{message && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}<button type="button" onClick={() => navigate("/login", { replace: true })} className="mt-3 block font-semibold underline">Go to sign in</button></div>}{!message && <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-700">Account email<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" />{fieldErrors.email && <span className="mt-1 block text-xs font-normal text-rose-600">{fieldErrors.email[0]}</span>}</label><label className="block text-sm font-semibold text-slate-700">New password<input required minLength={8} type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" />{fieldErrors.password && <span className="mt-1 block text-xs font-normal text-rose-600">{fieldErrors.password[0]}</span>}</label><label className="block text-sm font-semibold text-slate-700">Confirm new password<input required minLength={8} type="password" name="password_confirmation" value={form.password_confirmation} onChange={update} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" /></label><button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Resetting..." : "Reset password"}</button></form>}</div></div>;
}
