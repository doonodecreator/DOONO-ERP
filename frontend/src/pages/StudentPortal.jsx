import React, { useState, useEffect } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Overview" },
    { id: "timetable", label: "Timetable", page: "timetable" },
    { id: "assignments", label: "Assignments" },
    { id: "results", label: "Results", page: "results" },
    { id: "library", label: "Library", page: "library" },
];

export default function StudentPortal({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadStudentData = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await api.get("/student/dashboard");
                setData(res?.data && typeof res.data === "object" ? res.data : null);
            } catch (err) {
                setData(null);
                setError(err?.response?.data?.message || "Unable to load student portal data.");
            } finally {
                setLoading(false);
            }
        };
        loadStudentData();
    }, []);

    const student = data?.student_profile || {};
    const assignments = Array.isArray(data?.upcoming_assignments) ? data.upcoming_assignments : [];
    const results = Array.isArray(data?.recent_results) ? data.recent_results : [];
    const attendance = data?.attendance_summary || { present: 0, absent: 0 };
                <div className="mt-8 flex justify-end"><button onClick={() => window.open(`${api.defaults.baseURL}/report-cards/${student.id}/download`, "_blank")} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700">Download Latest Report Card</button></div>

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        setActiveTab(tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading student portal..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title={`Hi, ${student.first_name || "Student"} ${student.last_name || ""}!`}
                subtitle={`Student Portal • ${student.class?.name || 'Class Unassigned'} • ${student.admission_number || 'STD-0000'}`}
                action={
                    <div className="flex gap-3">
                        <div className="bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 text-center">
                            <p className="text-[10px] font-semibold text-emerald-600 uppercase">Present</p>
                            <p className="text-sm font-bold text-emerald-700">{attendance.present} Days</p>
                        </div>
                        <div className="bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100 text-center">
                            <p className="text-[10px] font-semibold text-rose-600 uppercase">Absent</p>
                            <p className="text-sm font-bold text-rose-700">{attendance.absent} Days</p>
                        </div>
                    </div>
                }
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Upcoming Assignments</h3>
                            <button type="button" onClick={() => openTab("assignments")} className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                        </div>
                        {assignments.length === 0 ? (
                            <EmptyState title="No upcoming assignments" message="Your active assignments will appear here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {assignments.map(a => (
                                    <div key={a.id} className="p-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-slate-800">{a.title}</h4>
                                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Due: {a.due_date}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{a.subject}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Test Scores</h3>
                            <button type="button" onClick={() => openTab("results")} className="text-xs font-semibold text-blue-600 hover:underline">View Full Result</button>
                        </div>
                        <div className="p-5">
                            {results.length === 0 ? (
                                <EmptyState title="No recent results published" message="Published test and examination scores will appear here." />
                            ) : (
                                <div className="space-y-4">
                                    {results.map((r, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div><p className="font-semibold text-slate-800 text-sm">{r.subject}</p></div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${r.score >= 70 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.max(0, r.score || 0))}%` }}></div>
                                                </div>
                                                <span className="font-bold text-slate-700 w-8 text-right">{r.score}%</span>
                                                <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{r.grade}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Portal</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">{TABS.find(t => t.id === activeTab)?.page ? "Opening the registered student workspace." : "This module is intentionally marked unavailable rather than displaying mock data."}</p>
                </div>
            )}
        </div>
    );
}
