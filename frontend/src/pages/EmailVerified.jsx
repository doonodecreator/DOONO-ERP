import { useNavigate } from "react-router-dom";

export default function EmailVerified() {
  const navigate = useNavigate();
  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div><h1 className="mt-4 text-2xl font-bold text-slate-900">Email verified successfully</h1><p className="mt-3 text-sm leading-6 text-slate-600">Your email address has been confirmed. You can now sign in with your account credentials.</p><button type="button" onClick={() => navigate("/login", { replace: true })} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white">Continue to sign in</button></div></div>;
}
