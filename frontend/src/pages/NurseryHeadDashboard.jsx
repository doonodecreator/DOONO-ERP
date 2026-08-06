import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function NurseryHeadDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/nursery-head/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading Nursery Head dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const summary = data?.nursery_summary || {};
    const metrics = data?.metrics || {};
    const classesList = data?.classes || [];
    const assessments = data?.recent_assessments || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "pupils", label: "Nursery Pupils" },
        { id: "teachers", label: "Nursery Teachers" },
        { id: "classes", label: "Nursery Classes" },
        { id: "assessment", label: "Assessment" },
        { id: "attendance", label: "Attendance" },
        { id: "timetable", label: "Timetable" },
        { id: "reports", label: "Reports" },
        { id: "communication", label: "Communication" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-100 text-pink-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        🧸
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Nursery Head Portal</h1>
                        <p className="text-sm text-slate-500">Head Teacher: <span className="font-semibold text-slate-700">{summary.head_name}</span> • {summary.school_name} ({summary.session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + Register New Pupil
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nursery Pupils</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_pupils || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teachers</p>
                    <p className="text-2xl font-bold text-pink-600 mt-1">{metrics.total_teachers || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classes</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.nursery_classes || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.today_attendance_pct || "0%"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Assessments</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending_assessments || 0}</p>
                </div>
            </div>

            {/* Navigation Bar (9 Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-pink-600 text-white shadow-md shadow-pink-200"
                                : "bg-white text-slate-600 hover:bg-pink-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Nursery Classes Overview */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Nursery Classes & Teachers</h3>
                            <button onClick={() => setActiveTab('classes')} className="text-xs font-semibold text-pink-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {classesList.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Teacher: <span className="font-semibold text-slate-700">{item.teacher}</span></p>
                                    </div>
                                    <span className="bg-pink-50 text-pink-700 text-xs px-3 py-1 rounded-md font-bold">
                                        {item.pupils} Pupils
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assessments Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Assessments</h3>
                            <button onClick={() => setActiveTab('assessment')} className="text-xs font-semibold text-pink-600 hover:underline">Manage</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {assessments.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">Class: <span className="font-medium text-slate-700">{item.class}</span> • Date: {item.date}</p>
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
                        Early childhood management tools for {tabs.find(t => t.id === activeTab)?.label} are active in this workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
