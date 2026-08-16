import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function Schools() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionSchool, setActionSchool] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [timeframeDate, setTimeframeDate] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");
    const [discountReason, setDiscountReason] = useState("");
    const [discountEndsAt, setDiscountEndsAt] = useState("");

    useEffect(() => {
        loadSchools();
    }, []);

    async function loadSchools() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/schools");
            setSchools(res.data.data || []);
        } catch (err) {
            setError(err.message || "Failed to load schools.");
        } finally {
            setLoading(false);
        }
    }

    async function toggleExemption(school) {
        setActionLoading(true);
        try {
            await api.post(`/schools/${school.id}/toggle-exemption`);
            await loadSchools();
        } catch (err) {
            setError(err.message || "Failed to toggle exemption.");
        } finally {
            setActionLoading(false);
        }
    }

    async function submitTimeframe(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/schools/${actionSchool.id}/grant-timeframe`, {
                expiry_date: timeframeDate,
            });
            setActionSchool(null);
            setActionType(null);
            setTimeframeDate("");
            await loadSchools();
        } catch (err) {
            setError(err.message || "Failed to set custom timeframe.");
        } finally {
            setActionLoading(false);
        }
    }

    async function submitDiscount(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/schools/${actionSchool.id}/set-discount`, {
                discount_percentage: discountPercent,
                discount_reason: discountReason || undefined,
                discount_ends_at: discountEndsAt || undefined,
            });
            setActionSchool(null);
            setActionType(null);
            setDiscountPercent("");
            setDiscountReason("");
            setDiscountEndsAt("");
            await loadSchools();
        } catch (err) {
            setError(err.message || "Failed to set discount.");
        } finally {
            setActionLoading(false);
        }
    }

    const cardStyle = {
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        marginBottom: 12,
    };

    const btnStyle = {
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #cbd5e1",
        background: "#fff",
        cursor: "pointer",
        fontSize: 13,
        marginRight: 8,
        marginTop: 6,
    };

    const inputStyle = {
        width: "100%",
        padding: 10,
        marginTop: 6,
        marginBottom: 12,
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        boxSizing: "border-box",
    };

    return (
        <div style={{ padding: 20 }}>
            <PageHeader
                title="Schools"
                subtitle="Every school on the platform. Grant free access, custom timeframes, or discounts."
            />

            {error && (
                <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>
                    {error}
                    <button onClick={() => setError("")} style={{ ...btnStyle, marginLeft: 12 }}>
                        Dismiss
                    </button>
                </div>
            )}

            {loading ? (
                <LoadingSpinner text="Loading schools..." />
            ) : schools.length === 0 ? (
                <EmptyState title="No Schools" message="No schools have registered on the platform yet." />
            ) : (
                /*
                 * NOTE: intentionally not using DataTable here. Each school
                 * needs an inline expanding form (timeframe/discount) below
                 * its row — DataTable doesn't support row expansion or
                 * modals yet (no Modal component exists in the shared
                 * library per the current component list). Revisit this
                 * once a Modal component is built — that's the correct
                 * home for these action forms, not an expanded table row.
                 */
                Array.isArray(schools) && schools.map((school) => (
                    <div key={school.id} style={cardStyle}>
                        <strong>{school.name}</strong>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                            {school.school_type} · {school.status} · Owner: {school.owner?.name || "—"}
                        </div>

                        <div>
                            <button
                                style={btnStyle}
                                disabled={actionLoading}
                                onClick={() => toggleExemption(school)}
                            >
                                Toggle Free Access
                            </button>
                            <button
                                style={btnStyle}
                                onClick={() => {
                                    setActionSchool(school);
                                    setActionType("timeframe");
                                }}
                            >
                                Grant Custom Timeframe
                            </button>
                            <button
                                style={btnStyle}
                                onClick={() => {
                                    setActionSchool(school);
                                    setActionType("discount");
                                }}
                            >
                                Set Discount
                            </button>
                        </div>

                        {actionSchool?.id === school.id && actionType === "timeframe" && (
                            <form onSubmit={submitTimeframe} style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                                <label style={{ fontSize: 13 }}>Access expires on</label>
                                <input
                                    type="date"
                                    required
                                    value={timeframeDate}
                                    onChange={(e) => setTimeframeDate(e.target.value)}
                                    style={inputStyle}
                                />
                                <button type="submit" disabled={actionLoading} style={btnStyle}>
                                    {actionLoading ? "Saving..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    style={btnStyle}
                                    onClick={() => {
                                        setActionSchool(null);
                                        setActionType(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}

                        {actionSchool?.id === school.id && actionType === "discount" && (
                            <form onSubmit={submitDiscount} style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                                <label style={{ fontSize: 13 }}>Discount percentage (0–100)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                    style={inputStyle}
                                />
                                <label style={{ fontSize: 13 }}>Reason (optional)</label>
                                <input
                                    type="text"
                                    value={discountReason}
                                    onChange={(e) => setDiscountReason(e.target.value)}
                                    style={inputStyle}
                                />
                                <label style={{ fontSize: 13 }}>Discount ends on (optional)</label>
                                <input
                                    type="date"
                                    value={discountEndsAt}
                                    onChange={(e) => setDiscountEndsAt(e.target.value)}
                                    style={inputStyle}
                                />
                                <button type="submit" disabled={actionLoading} style={btnStyle}>
                                    {actionLoading ? "Saving..." : "Apply Discount"}
                                </button>
                                <button
                                    type="button"
                                    style={btnStyle}
                                    onClick={() => {
                                        setActionSchool(null);
                                        setActionType(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
