import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const { user, refreshContext, logout } = useAuth();
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    setFieldErrors({});
    try {
      const response = await api.put("/me/change-password", form);
      await refreshContext();
      setMessage(response?.data?.message || "Password changed successfully. Your portal is now ready.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to change your password.");
      setFieldErrors(requestError?.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8"><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Secure your account</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Change your temporary password</h1><p className="mt-2 text-sm leading-6 text-slate-600">Welcome, {user?.name || "portal user"}. Your school issued a temporary password. You must create a private password before accessing the portal.</p></div>{error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Temporary password<input required type="password" name="current_password" value={form.current_password} onChange={update} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" />{fieldErrors.current_password && <span className="mt-1 block text-xs font-normal text-rose-600">{fieldErrors.current_password[0]}</span>}</label><label className="block text-sm font-semibold text-slate-700">New password<input required minLength={8} type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" />{fieldErrors.password && <span className="mt-1 block text-xs font-normal text-rose-600">{fieldErrors.password[0]}</span>}</label><label className="block text-sm font-semibold text-slate-700">Confirm new password<input required minLength={8} type="password" name="password_confirmation" value={form.password_confirmation} onChange={update} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" /></label><button type="submit" disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Updating password..." : "Change password and continue"}</button></form><button type="button" onClick={logout} className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Log out</button></div></div>;
}
