import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

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

    const columns = [
        { key: "user", label: "User", render: (row) => row.user || "System" },
        { key: "action", label: "Action" },
        { key: "time", label: "Time", align: "right" },
    ];

    const list = tab === "schools" ? schoolActivity : myActions;

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

    return (
        <div style={{ padding: 20 }}>
            <PageHeader
                title="Audit Logs"
                subtitle="What schools are doing, and your own platform-level actions — kept separate so schools never see your activity."
            />

            <div style={{ marginBottom: 16 }}>
                <button style={tabBtn(tab === "schools")} onClick={() => setTab("schools")}>
                    School Activity
                </button>
                <button style={tabBtn(tab === "mine")} onClick={() => setTab("mine")}>
                    My Actions
                </button>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 16, borderRadius: 12, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingSpinner text="Loading audit logs..." />
            ) : list.length === 0 ? (
                <EmptyState title="No Activity" message="No activity has been recorded yet." />
            ) : (
                <DataTable columns={columns} data={list} emptyMessage="No activity recorded." />
            )}
        </div>
    );
}
