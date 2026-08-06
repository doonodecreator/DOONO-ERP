import { useState, useEffect } from "react";
import api from "../services/api";

export default function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadOrganizations();
    }, []);

    async function loadOrganizations() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/organizations");
            setOrganizations(res.data.data || []);
        } catch (err) {
            setError(err.message || "Failed to load organizations.");
        } finally {
            setLoading(false);
        }
    }

    async function viewOrganization(org) {
        setSelected(org);
        setSelectedDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/organizations/${org.id}`);
            setSelectedDetail(res.data.data);
        } catch (err) {
            setError(err.message || "Failed to load organization details.");
        } finally {
            setDetailLoading(false);
        }
    }

    const containerStyle = {
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
    };

    const cardStyle = {
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        marginBottom: 16,
    };

    if (selected) {
        return (
            <div style={containerStyle}>
                <button
                    onClick={() => {
                        setSelected(null);
                        setSelectedDetail(null);
                    }}
                    style={{
                        marginBottom: 16,
                        background: "none",
                        border: "none",
                        color: "#1e3a8a",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    ← Back to Organizations
                </button>

                {detailLoading && <p>Loading details...</p>}

                {selectedDetail && (
                    <>
                        <div style={cardStyle}>
                            <h2 style={{ margin: "0 0 4px 0" }}>{selectedDetail.name}</h2>
                            <p style={{ color: "#64748b", margin: 0 }}>
                                {selectedDetail.short_name || "—"} · {selectedDetail.status}
                            </p>

                            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <strong>Owner:</strong> {selectedDetail.owner?.name || "—"}
                                </div>
                                <div>
                                    <strong>Email:</strong> {selectedDetail.email || "—"}
                                </div>
                                <div>
                                    <strong>Phone:</strong> {selectedDetail.phone || "—"}
                                </div>
                                <div>
                                    <strong>Registration No:</strong> {selectedDetail.registration_number || "—"}
                                </div>
                                <div>
                                    <strong>Location:</strong> {[selectedDetail.lga, selectedDetail.state, selectedDetail.country].filter(Boolean).join(", ") || "—"}
                                </div>
                                <div>
                                    <strong>Address:</strong> {selectedDetail.address || "—"}
                                </div>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0 }}>Schools ({selectedDetail.schools?.length || 0})</h3>
                            {(!selectedDetail.schools || selectedDetail.schools.length === 0) && (
                                <p style={{ color: "#94a3b8" }}>No schools under this organization yet.</p>
                            )}
                            {selectedDetail.schools?.map((school) => (
                                <div
                                    key={school.id}
                                    style={{
                                        padding: "10px 0",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <strong>{school.name}</strong>
                                    <div style={{ fontSize: 13, color: "#64748b" }}>
                                        {school.school_type} · {school.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h1 style={{ marginBottom: 4 }}>Organizations</h1>
            <p style={{ color: "#64748b", marginTop: 0, marginBottom: 20 }}>
                Every organization registered on the platform.
            </p>

            {error && (
                <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p>Loading organizations...</p>
            ) : organizations.length === 0 ? (
                <div style={cardStyle}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No organizations yet.</p>
                </div>
            ) : (
                organizations.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => viewOrganization(org)}
                        style={{
                            ...cardStyle,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <strong>{org.name}</strong>
                            <div style={{ fontSize: 13, color: "#64748b" }}>
                                Owner: {org.owner?.name || "—"} · {org.status}
                            </div>
                        </div>
                        <span style={{ color: "#94a3b8" }}>→</span>
                    </div>
                ))
            )}
        </div>
    );
}
