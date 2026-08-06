import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function PrincipalDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/principal/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading principal dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const school = data?.school_summary || {};
    const metrics = data?.metrics || {};
    const approvals = data?.pending_approvals || [];
    const departments = data?.teacher_stats || [];
    const comms = data?.recent_announcements || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "manage_teachers", label: "Manage Teachers" },
        { id: "manage_students", label: "Manage Students" },
        { id: "approve_admissions", label: "Approve Admissions" },
        { id: "approve_results", label: "Approve Results" },
        { id: "approve_timetable", label: "Approve Timetable" },
        { id: "approve_promotions", label: "Approve Promotions" },
        { id: "view_attendance", label: "View Attendance" },
        { id: "view_finance", label: "View Finance" },
        { id: "reports", label: "Reports" },
        { id: "communication", label: "Communication" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        🎓
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Principal Portal</h1>
                        <p className="text-sm text-slate-500">Principal: <span className="font-semibold text-slate-700">{school.principal_name}</span> • {school.school_name} ({school.academic_session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        Publish School Circular
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teachers</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_teachers || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Students</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.total_students || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Admissions</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending_admissions || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Result Approvals</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.pending_results_approval || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Attendance</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.attendance_rate || "0%"}</p>
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
                                ? "bg-blue-700 text-white shadow-md shadow-blue-200"
                                : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sub-Module Views */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Approvals Queue */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Academic & Administrative Approvals Queue</h3>
                            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-bold">{approvals.length} Pending</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {approvals.map((a) => (
                                <div key={a.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{a.type}</span>
                                            <h4 className="font-semibold text-slate-800 text-sm">{a.details}</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Submitted by: <span className="font-medium text-slate-700">{a.submitted_by}</span> • {a.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">Approve</button>
                                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200">Review</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Department Heads Overview */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Academic Departments</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {departments.map((dept, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-slate-800 text-sm">{dept.department}</h4>
                                        <span className="text-xs font-bold text-slate-500">{dept.count} Staff</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">HOD: <span className="font-medium text-slate-700">{dept.head}</span></p>
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
                        Full administrative tools and workflow actions for {tabs.find(t => t.id === activeTab)?.label} are active in this workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
