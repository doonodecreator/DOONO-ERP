import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function VicePrincipalAdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/vp-admin/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading VP Admin dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-cyan-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const summary = data?.admin_summary || {};
    const metrics = data?.metrics || {};
    const leaves = data?.leave_requests || [];
    const events = data?.upcoming_events || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "staff_mgmt", label: "Staff Management" },
        { id: "staff_attendance", label: "Staff Attendance" },
        { id: "leave_mgmt", label: "Leave Management" },
        { id: "discipline", label: "Discipline / Behaviour" },
        { id: "inventory", label: "Inventory / Assets" },
        { id: "events", label: "Events Management" },
        { id: "health_safety", label: "Health & Safety" },
        { id: "facilities", label: "Facilities Management" },
        { id: "reports", label: "Reports" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        🏛️
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">VP Administration Panel</h1>
                        <p className="text-sm text-slate-500">VP Admin: <span className="font-semibold text-slate-700">{summary.vp_name}</span> • {summary.school_name} ({summary.session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + New Event / Asset Entry
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_staff || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Today</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.staff_present_today || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Requests</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending_leave_requests || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discipline Cases</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.open_discipline_cases || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.total_assets_count || 0}</p>
                </div>
            </div>

            {/* Navigation Bar (10 Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-cyan-700 text-white shadow-md shadow-cyan-200"
                                : "bg-white text-slate-600 hover:bg-cyan-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Sub-Module Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Staff Leave Requests */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Pending Leave Requests</h3>
                            <button onClick={() => setActiveTab('leave_mgmt')} className="text-xs font-semibold text-cyan-700 hover:underline">Manage All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {leaves.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.staff}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.type} • Duration: <span className="font-semibold text-slate-700">{item.duration}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold">Approve</button>
                                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* School Events Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Upcoming Events</h3>
                            <button onClick={() => setActiveTab('events')} className="text-xs font-semibold text-cyan-700 hover:underline">Schedule</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {events.map((ev, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{ev.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">Venue: {ev.venue}</p>
                                    <span className="inline-block mt-2 text-[10px] bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded font-bold">{ev.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{tabs.find(t => t.id === activeTab)?.label} Sub-Module</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                        Administrative workspace for {tabs.find(t => t.id === activeTab)?.label} is active.
                    </p>
                </div>
            )}
        </div>
    );
}
