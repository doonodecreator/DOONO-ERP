import { useState, useEffect } from "react";
import api from "../services/api";

export default function AuditLogs() {
    const [schoolActivity, setSchoolActivity] = useState([]);
    const [myActions, setMyActions] = useState([]);
    const [tab, setTab] = useState("schools");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/platform-owner/dashboard");
            setSchoolActivity(res.data.school_activity || []);
            setMyActions(res.data.my_actions || []);
        } catch (err) {
            setError(err.message || "Failed to load audit logs.");
        } finally {
            setLoading(false);
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
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        marginBottom: 10,
    };

    const tabBtn = (active) => ({
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        marginRight: 8,
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
        background: active ? "#1e3a8a" : "#e2e8f0",
        color: active ? "#fff" : "#334155",
    });

    const list = tab === "schools" ? schoolActivity : myActions;

    return (
        <div style={containerStyle}>
            <h1 style={{ marginBottom: 4 }}>Audit Logs</h1>
            <p style={{ color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                What schools are doing, and your own platform-level actions — kept separate
                so schools never see your activity, and you can see theirs.
            </p>

            <div style={{ marginBottom: 16 }}>
                <button style={tabBtn(tab === "schools")} onClick={() => setTab("schools")}>
                    School Activity
                </button>
                <button style={tabBtn(tab === "mine")} onClick={() => setTab("mine")}>
                    My Actions
                </button>
            </div>

            {error && (
                <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : list.length === 0 ? (
                <div style={cardStyle}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No activity recorded yet.</p>
                </div>
            ) : (
                list.map((entry, i) => (
                    <div key={i} style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>{entry.user || "System"}</strong>
                            <span style={{ color: "#94a3b8", fontSize: 13 }}>{entry.time}</span>
                        </div>
                        <div style={{ marginTop: 4, color: "#334155" }}>{entry.action}</div>
                    </div>
                ))
            )}
        </div>
    );
}
