import React, { useState, useEffect } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function ProprietorDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/proprietor/dashboard");
            setData(res?.data || null);
        } catch (err) {
            setData(null);
            setError(err.message || "Unable to load the Proprietor dashboard.");
        } finally {
            setLoading(false);
        }
    };

    const openTab = (tabId) => {
        const pageMap = {
            staff: "staff",
            leadership: "role-invitations",
            academics: "classes",
            school_setup: "school-setup",
            students: "students",
            finance: "fees",
            reports: "report-cards",
            school_settings: "settings",
            subscriptions: "subscriptions",
            audit_logs: "audit-logs",
        };

        if (pageMap[tabId] && setPage) {
            setPage(pageMap[tabId]);
            return;
        }

        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading Proprietor dashboard..." />;
    }

    const school = data?.school_info && typeof data.school_info === "object" ? data.school_info : {};
    const stats = data?.overview_stats && typeof data.overview_stats === "object" ? data.overview_stats : {};
    const leadership = Array.isArray(data?.leadership) ? data.leadership : [];
    const pendingInvitations = Array.isArray(data?.pending_role_invitations) ? data.pending_role_invitations : [];
    const auditLogs = Array.isArray(data?.audit_logs) ? data.audit_logs : [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "staff", label: "Staff Management" },
        { id: "leadership", label: "Leadership Assignment" },
        { id: "academics", label: "Academic Management" },
        { id: "school_setup", label: "Initial School Setup" },
        { id: "students", label: "Student Management" },
        { id: "finance", label: "Finance Management" },
        { id: "reports", label: "Reports" },
        { id: "school_settings", label: "School Settings" },
        { id: "subscriptions", label: "Subscriptions" },
        { id: "audit_logs", label: "Audit Logs" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {error && <div role="alert" className="error-message mb-4">{error}</div>}
            {/* Proprietor Master Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        👑
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{school.name || "My School"}</h1>
                        <p className="text-sm text-slate-500">Proprietor Dashboard • Session: {school.session || "—"} ({school.term || "—"})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => openTab("reports")} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        Executive Overview Report
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_staff || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.total_students || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Term Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.total_revenue || "₦0"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending_approvals || 0}</p>
                </div>
            </div>

            {/* Navigation Bar (Role-Specific Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => openTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-amber-600 text-white shadow-md shadow-amber-200"
                                : "bg-white text-slate-600 hover:bg-amber-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Views */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leadership Roles Summary */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Leadership Assignment Overview</h3>
                            <button type="button" onClick={() => openTab("leadership")} className="text-xs font-semibold text-amber-600 hover:underline">Manage All</button>
                        </div>
                        {leadership.length === 0 ? (
                            <EmptyState title="No leadership assigned" message="Use Leadership Assignment to invite a Principal, Cashier, or other role holder." />
                        ) : (
                        <div className="divide-y divide-slate-100">
                            {leadership.map((item) => (
                                <div key={`${item.role}-${item.name}`} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{item.role}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.name}</p>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-bold">{item.status}</span>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>

                    {/* Pending Invitations */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Pending Role Invitations</h3>
                            <button type="button" onClick={() => openTab("leadership")} className="text-xs font-semibold text-amber-600 hover:underline">Manage</button>
                        </div>
                        {pendingInvitations.length === 0 ? (
                            <EmptyState title="No pending invitations" message="Accepted roles become active only after the invitee completes the secure invitation." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {pendingInvitations.map((invitation) => (
                                    <div key={invitation.id} className="p-4">
                                        <p className="font-semibold text-slate-800 text-sm">{invitation.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{invitation.role} • {invitation.email}</p>
                                        <p className="text-xs text-amber-600 mt-1">Pending acceptance</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Audit Trail Preview */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">System Audit Trail</h3>
                            <button type="button" onClick={() => openTab("audit_logs")} className="text-xs font-semibold text-amber-600 hover:underline">View Logs</button>
                        </div>
                        {auditLogs.length === 0 ? (
                            <EmptyState title="No school audit activity" message="School actions will appear here while platform-owner actions remain separated." />
                        ) : (
                        <div className="divide-y divide-slate-100">
                            {auditLogs.map((log, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <p className="text-xs font-semibold text-slate-800">{log.action}</p>
                                    <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                                        <span>{log.user}</span>
                                        <span>{log.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
