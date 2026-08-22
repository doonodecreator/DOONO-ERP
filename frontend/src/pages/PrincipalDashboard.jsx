import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function PrincipalDashboard({ setPage }) {
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
            const res = await api.get("/principal/dashboard");
            setData(res?.data || null);
        } catch (err) {
            setData(null);
            setError(err.message || "Unable to load the Principal dashboard.");
        } finally {
            setLoading(false);
        }
    };

    const openTab = (tabId) => {
        const pageMap = {
            manage_teachers: "teachers",
            manage_students: "students",
            approve_admissions: "student-enrollments",
            approve_results: "results",
            approve_timetable: "timetable",
            approve_promotions: "promotions",
            view_attendance: "attendance",
            view_finance: "fees",
            reports: "report-cards",
        };

        if (pageMap[tabId] && setPage) {
            setPage(pageMap[tabId]);
            return;
        }

        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading Principal dashboard..." />;
    }

    const school = data?.school_summary && typeof data.school_summary === "object" ? data.school_summary : {};
    const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics : {};
    const approvals = Array.isArray(data?.pending_approvals) ? data.pending_approvals : [];
    const departments = Array.isArray(data?.teacher_stats) ? data.teacher_stats : [];
    const comms = Array.isArray(data?.recent_announcements) ? data.recent_announcements : [];
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
    ];

    const metricValue = (value, fallback = "—") => value === null || value === undefined ? fallback : value;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {error && <div role="alert" className="error-message mb-4">{error}</div>}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-xs font-bold shadow-inner">
                        Principal
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Principal Portal</h1>
                        <p className="text-sm text-slate-500">
                            Principal: <span className="font-semibold text-slate-700">{school.principal_name || "Current user"}</span>
                            {school.school_name ? ` • ${school.school_name}` : ""}
                            {school.academic_session ? ` (${school.academic_session})` : ""}
                            {school.term ? ` • ${school.term}` : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teachers</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metricValue(metrics.total_teachers, 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Students</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metricValue(metrics.total_students, 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Admissions</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metricValue(metrics.pending_admissions)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Result Approvals</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{metricValue(metrics.pending_results_approval, 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">30-Day Attendance</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{metricValue(metrics.attendance_rate, "0%")}</p>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => openTab(tab.id)}
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

            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Pending Result Submissions</h3>
                            <button type="button" onClick={() => openTab("approve_results")} className="text-xs font-semibold text-blue-700 hover:underline">Open Results</button>
                        </div>
                        {approvals.length === 0 ? (
                            <EmptyState title="No pending result submissions" message="Submitted results awaiting review will appear here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {approvals.map((approval) => (
                                    <div key={approval.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{approval.type}</span>
                                                <h4 className="font-semibold text-slate-800 text-sm">{approval.details}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Submitted by: <span className="font-medium text-slate-700">{approval.submitted_by}</span> • {approval.date || "Date unavailable"}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => openTab("approve_results")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200">
                                            Review Results
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Academic Departments</h3>
                        </div>
                        {departments.length === 0 ? (
                            <EmptyState title="No department data" message="Active staff with departments will appear here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {departments.map((department) => (
                                    <div key={department.department} className="p-4 hover:bg-slate-50">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-slate-800 text-sm">{department.department}</h4>
                                            <span className="text-xs font-bold text-slate-500">{department.count} Staff</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Department head: <span className="font-medium text-slate-700">{department.head || "Not assigned"}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Recent Announcements</h3>
                        </div>
                        {comms.length === 0 ? (
                            <EmptyState title="No announcements available" message="The current API does not yet expose an announcement feed." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {comms.map((announcement) => (
                                    <div key={`${announcement.title}-${announcement.date}`} className="p-4">
                                        <h4 className="font-semibold text-slate-800 text-sm">{announcement.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">Audience: {announcement.target || "Not specified"} • {announcement.date || "Date unavailable"}</p>
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
