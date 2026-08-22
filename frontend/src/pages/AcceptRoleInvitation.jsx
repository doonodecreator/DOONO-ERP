import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

export default function AcceptRoleInvitation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, login, logout, refreshContext } = useAuth();
    const token = searchParams.get("token") || "";
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({ email: "", password: "", password_confirmation: "" });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPreview = async () => {
            if (!token) {
                setError("This invitation link is missing its token.");
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/role-invitations/preview/${encodeURIComponent(token)}`);
                const invitation = response?.data?.data || null;
                setPreview(invitation);
                setForm((current) => ({ ...current, email: invitation?.email || "" }));
            } catch (err) {
                setError(err.response?.data?.message || err.message || "This invitation is invalid or expired.");
            } finally {
                setLoading(false);
            }
        };

        loadPreview();
    }, [token]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const goToExistingAccountLogin = () => {
        const returnTo = `/role-invitation/accept?token=${encodeURIComponent(token)}`;
        const email = preview?.email || form.email;
        navigate(`/login?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
    };

    const acceptInvitation = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            let acceptanceResponse;
            if (isAuthenticated) {
                if (user?.email && preview?.email && user.email.toLowerCase() !== preview.email.toLowerCase()) {
                    setError(`This invitation is for ${preview.email}. Sign out and sign in with that email before accepting it.`);
                    return;
                }
                acceptanceResponse = await api.post("/role-invitations/accept-authenticated", { token });
                await refreshContext();
            } else {
                acceptanceResponse = await api.post("/role-invitations/accept", { ...form, token });
                if (acceptanceResponse?.data?.verification_required) {
                    navigate(`/verify-email?email=${encodeURIComponent(acceptanceResponse.data.email || form.email)}`, { replace: true });
                    return;
                }
                if (acceptanceResponse?.data?.token) await login(acceptanceResponse.data.token);
            }

            const staffId = acceptanceResponse?.data?.staff_id;
            navigate(staffId ? `/role-invitation/profile?staff_id=${encodeURIComponent(staffId)}` : "/", { replace: true });
        } catch (err) {
            const validationMessage = err.errors ? Object.values(err.errors).flat().join(" ") : "";
            setError(err.response?.data?.message || validationMessage || err.message || "Unable to accept this invitation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Checking invitation..." />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h1 className="text-2xl font-bold text-slate-900">Accept School Role Invitation</h1>
                {error && <div role="alert" className="error-message mt-4">{error}</div>}

                {preview && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-5">
                        <p className="text-sm text-amber-900">You have been invited as <strong>{preview.role}</strong> at <strong>{preview.school}</strong>.</p>
                        {preview.form_class && <p className="text-sm font-semibold text-amber-900 mt-2">Form class: {preview.form_class}{preview.form_stream ? ` · ${preview.form_stream}` : " · All streams"}</p>}
                        <p className="text-xs text-amber-700 mt-1">The role is school-scoped and will become active only after this invitation is accepted.</p>
                    </div>
                )}

                {preview && (
                    <form onSubmit={acceptInvitation} className="space-y-4 mt-6">
                        {!isAuthenticated && (
                            <>
                                <div>
                                    <label htmlFor="invitation-email" className="block text-sm font-semibold text-slate-700 mb-1">Invited email</label>
                                    <input id="invitation-email" required type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="invitation-password" className="block text-sm font-semibold text-slate-700 mb-1">Create password</label>
                                    <input id="invitation-password" required minLength={8} type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="invitation-password-confirmation" className="block text-sm font-semibold text-slate-700 mb-1">Confirm password</label>
                                    <input id="invitation-password-confirmation" required minLength={8} type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} autoComplete="new-password" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    {form.password_confirmation && form.password !== form.password_confirmation && (
                                        <p className="text-xs text-red-600 mt-1">The two passwords must match exactly.</p>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">This creates your DONO account and activates the invited school role. Use the invited email shown above.</p>
                                <button type="button" onClick={goToExistingAccountLogin} className="text-left text-sm font-semibold text-indigo-600 underline">Already have a DONO account? Sign in first</button>
                            </>
                        )}
                        {isAuthenticated && user?.email && preview?.email && user.email.toLowerCase() !== preview.email.toLowerCase() && (
                            <button type="button" onClick={logout} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Sign out and use the invited email</button>
                        )}
                        <button type="submit" disabled={submitting || (!isAuthenticated && form.password !== form.password_confirmation)} className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {submitting ? "Activating Role..." : isAuthenticated ? "Accept and Activate Role" : "Create Account and Accept Role"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
