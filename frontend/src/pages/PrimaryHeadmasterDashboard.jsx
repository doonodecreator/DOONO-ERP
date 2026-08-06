import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function PrimaryHeadmasterDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/primary-headmaster/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading Primary Headmaster dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const summary = data?.headmaster_summary || {};
    const metrics = data?.metrics || {};
    const classesList = data?.classes || [];
    const results = data?.recent_results || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "primary_classes", label: "Primary Classes" },
        { id: "primary_teachers", label: "Primary Teachers" },
        { id: "subjects", label: "Subjects" },
        { id: "attendance", label: "Attendance" },
        { id: "assessment", label: "Assessment" },
        { id: "results", label: "Results" },
        { id: "promotion", label: "Promotion" },
        { id: "reports", label: "Reports" },
        { id: "communication", label: "Communication" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        🎒
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Primary Headmaster Portal</h1>
                        <p className="text-sm text-slate-500">Headmaster: <span className="font-semibold text-slate-700">{summary.headmaster_name}</span> • {summary.school_name} ({summary.session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + Manage Primary Promotion
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Pupils</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_pupils || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Teachers</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.total_teachers || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Classes</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.primary_classes || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.today_attendance_pct || "0%"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Promotions</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending_promotions || 0}</p>
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
                                ? "bg-orange-600 text-white shadow-md shadow-orange-200"
                                : "bg-white text-slate-600 hover:bg-orange-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Classes & Form Teachers */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Primary Class Allocations</h3>
                            <button onClick={() => setActiveTab('primary_classes')} className="text-xs font-semibold text-orange-600 hover:underline">Manage All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {classesList.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Form Teacher: <span className="font-semibold text-slate-700">{item.teacher}</span></p>
                                    </div>
                                    <span className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-md font-bold">
                                        {item.pupils} Pupils
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Results Approval Tracker */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Results Approvals</h3>
                            <button onClick={() => setActiveTab('results')} className="text-xs font-semibold text-orange-600 hover:underline">Review</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {results.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{item.class}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.type}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{item.date}</span>
                                    </div>
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
                        Primary academic administration tools for {tabs.find(t => t.id === activeTab)?.label} are loaded and ready.
                    </p>
                </div>
            )}
        </div>
    );
}
