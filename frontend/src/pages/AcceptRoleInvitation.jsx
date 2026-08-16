import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

export default function AcceptRoleInvitation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, login, refreshContext } = useAuth();
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
                setError(err.message || "This invitation is invalid or expired.");
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

    const acceptInvitation = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            if (isAuthenticated) {
                await api.post("/role-invitations/accept-authenticated", { token });
                await refreshContext();
            } else {
                const response = await api.post("/role-invitations/accept", { ...form, token });
                await login(response.data.token);
            }

            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "Unable to accept this invitation.");
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
                        <p className="text-xs text-amber-700 mt-1">The role is school-scoped and will become active only after this invitation is accepted.</p>
                    </div>
                )}

                {preview && (
                    <form onSubmit={acceptInvitation} className="space-y-4 mt-6">
                        {!isAuthenticated && (
                            <>
                                <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Invitation email" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                <input required minLength={8} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Create your password" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                <input required minLength={8} type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} placeholder="Confirm your password" className="w-full px-3 py-2 border rounded-lg text-sm" />
                                <p className="text-xs text-slate-500">If this email already has a DONO account, sign in first and reopen this invitation link.</p>
                            </>
                        )}
                        <button type="submit" disabled={submitting} className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {submitting ? "Activating Role..." : isAuthenticated ? "Accept and Activate Role" : "Create Account and Accept Role"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
