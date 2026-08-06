import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function ProprietorDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/proprietor/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading proprietor dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const school = data?.school_info || {};
    const stats = data?.overview_stats || {};
    const leadership = data?.leadership || [];
    const auditLogs = data?.audit_logs || [];
    const comms = data?.recent_communications || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "staff", label: "Staff Management" },
        { id: "leadership", label: "Leadership Assignment" },
        { id: "academics", label: "Academic Management" },
        { id: "students", label: "Student Management" },
        { id: "finance", label: "Finance Management" },
        { id: "reports", label: "Reports" },
        { id: "school_settings", label: "School Settings" },
        { id: "system_settings", label: "System Settings" },
        { id: "communication", label: "Communication" },
        { id: "audit_logs", label: "Audit Logs" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Proprietor Master Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        👑
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
                        <p className="text-sm text-slate-500">Proprietor: <span className="font-semibold text-slate-700">{school.proprietor_name}</span> • Session: {school.session} ({school.term})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
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

            {/* Navigation Bar (11 Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                            <button onClick={() => setActiveTab('leadership')} className="text-xs font-semibold text-amber-600 hover:underline">Manage All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {leadership.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{item.role}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.name}</p>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-bold">{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audit Trail Preview */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">System Audit Trail</h3>
                            <button onClick={() => setActiveTab('audit_logs')} className="text-xs font-semibold text-amber-600 hover:underline">View Logs</button>
                        </div>
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
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{tabs.find(t => t.id === activeTab)?.label} Module</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                        Full controls and management grids for {tabs.find(t => t.id === activeTab)?.label} are active in this section.
                    </p>
                </div>
            )}
        </div>
    );
}
