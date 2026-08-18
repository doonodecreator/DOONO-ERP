import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function AuditLogs() {
    const { isPlatformAdmin } = useAuth();
    const [schoolActivity, setSchoolActivity] = useState([]);
    const [platformActivity, setPlatformActivity] = useState([]);
    const [mySchoolActivity, setMySchoolActivity] = useState([]);
    const [tab, setTab] = useState(isPlatformAdmin ? "schools" : "my_school");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/activity-logs");
            if (isPlatformAdmin) {
                setSchoolActivity(res.data.school_activity?.data || []);
                setPlatformActivity(res.data.platform_activity?.data || []);
            } else {
                setMySchoolActivity(res.data.data?.data || []);
            }
        } catch (err) {
            setError(err.message || "Failed to load audit logs.");
        } finally {
            setLoading(false);
        }
    }

    const columns = [
        { key: "user", label: "User", render: (row) => row.user?.name || "System" },
        { key: "action", label: "Action", render: (row) => row.description || `${row.module}.${row.action}` },
        { key: "time", label: "Time", render: (row) => new Date(row.created_at).toLocaleString(), align: "right" },
    ];

    const list = isPlatformAdmin
        ? (tab === "schools" ? schoolActivity : platformActivity)
        : mySchoolActivity;

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
                subtitle={isPlatformAdmin
                    ? "Monitor school activity and platform-level actions separately."
                    : "Track all activities within your school."}
            />

            {isPlatformAdmin && (
                <div style={{ marginBottom: 16 }}>
                    <button style={tabBtn(tab === "schools")} onClick={() => setTab("schools")}>
                        School Activity
                    </button>
                    <button style={tabBtn(tab === "platform")} onClick={() => setTab("platform")}>
                        Platform Actions
                    </button>
                </div>
            )}

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
