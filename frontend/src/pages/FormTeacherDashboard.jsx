import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "my_class", label: "My Class", page: "classes" },
    { id: "attendance", label: "Attendance", page: "attendance" },
    { id: "behaviour", label: "Behaviour", page: "discipline" },
    { id: "parents", label: "Parents", page: "parents" },
    { id: "recommendations", label: "Recommendations", page: "promotions" },
];

export default function FormTeacherDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/form-teacher/dashboard");
                setData(response?.data && typeof response.data === "object" ? response.data : null);
            } catch (requestError) {
                setData(null);
                setError(requestError?.response?.data?.message || "Unable to load form teacher dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const profile = data?.profile || {};
    const students = Array.isArray(data?.class_students) ? data.class_students : [];
    const tasks = data?.pending_tasks || { behaviour_reports: 0, parent_messages: 0 };
    const logs = Array.isArray(data?.recent_behaviour_logs) ? data.recent_behaviour_logs : [];

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        setActiveTab(tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading form teacher portal..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title={`Form Master: ${profile.first_name || "Teacher"}`}
                subtitle={`Class: ${profile.form_class || 'Unassigned'} • ${profile.total_students || 0} Students`}
                action={<button type="button" onClick={() => openTab("attendance")} className="btn-primary">Mark Form Attendance</button>}
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            {data?.message && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    <strong>Note:</strong> {data.message}
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-slate-600 hover:bg-violet-50 border border-slate-200"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.behaviour_reports > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3"><span className="text-rose-600 text-xl">🚩</span><p className="font-semibold text-rose-900 text-sm">You have {tasks.behaviour_reports} pending behaviour reports to review.</p></div>
                                <button type="button" onClick={() => openTab("behaviour")} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Review</button>
                            </div>
                        )}
                        {tasks.parent_messages > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3"><span className="text-blue-600 text-xl">💬</span><p className="font-semibold text-blue-900 text-sm">{tasks.parent_messages} unread messages from parents.</p></div>
                                <button type="button" onClick={() => openTab("parents")} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Inbox</button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">Form Class Roster ({profile.form_class || "Unassigned"})</h3><button type="button" onClick={() => openTab("my_class")} className="text-xs font-semibold text-violet-600 hover:underline">View All</button></div>
                        {students.length === 0 ? <EmptyState title="No students in class" message="Students assigned to your form class will appear here." /> : (
                            <div className="divide-y divide-slate-100">{students.map((s, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div><p className="font-semibold text-slate-800 text-sm">{s.name}</p><p className="text-xs text-slate-500">{s.admission_number}</p></div>
                                    <div className="text-right"><p className="text-xs font-semibold text-slate-500 mb-1">Attendance</p><div className="flex items-center gap-2"><div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${s.attendance_rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${s.attendance_rate}%` }}></div></div><span className="text-xs font-bold text-slate-700">{s.attendance_rate}%</span></div></div>
                                </div>
                            ))}</div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-900">Recent Behaviour Logs</h3></div>
                        {logs.length === 0 ? <EmptyState title="No recent logs" message="Recent student behaviour incidents will appear here." /> : (
                            <div className="divide-y divide-slate-100">{logs.map((log, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-start mb-1"><h4 className="font-semibold text-slate-800 text-sm">{log.student}</h4><span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">{log.status}</span></div>
                                    <p className="text-xs text-slate-600 mt-1">{log.incident}</p><p className="text-[10px] text-slate-400 mt-2">{log.date}</p>
                                </div>
                            ))}</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab.replace("_", " ")}</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">{TABS.find(t => t.id === activeTab)?.page ? "Opening the registered form-teacher workspace." : "This module is intentionally marked unavailable rather than displaying mock data."}</p>
                </div>
            )}
        </div>
    );
}
