import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "my_classes", label: "My Classes", page: "classes" },
    { id: "my_subjects", label: "My Subjects", page: "subjects" },
    { id: "attendance", label: "Attendance", page: "attendance" },
    { id: "assignments", label: "Assignments" },
    { id: "ca_scores", label: "CA Scores", page: "result-entry" },
];

export default function TeacherDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/teacher/dashboard");
                setData(response?.data && typeof response.data === "object" ? response.data : null);
            } catch (requestError) {
                setData(null);
                setError(requestError?.response?.data?.message || "Unable to load teacher dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const teacher = data?.teacher_profile || {};
    const classes = Array.isArray(data?.my_classes) ? data.my_classes : [];
    const subjects = Array.isArray(data?.my_subjects) ? data.my_subjects : [];
    const assignments = Array.isArray(data?.recent_assignments) ? data.recent_assignments : [];
    const tasks = data?.pending_tasks || { upload_ca: 0, mark_attendance: 0 };
    const context = data?.context || {};

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        setActiveTab(tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading teacher portal..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title={`Welcome, ${teacher.first_name || "Teacher"}`}
                subtitle={`Teacher Portal • ${teacher.department || "General"} Dept • ${teacher.employee_id || "EMP-XXXX"} • ${context.session || "Session"} / ${context.term || "Term"}`}
                action={<button type="button" onClick={() => openTab("ca_scores")} className="btn-primary">Upload CA Scores</button>}
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-white text-slate-600 hover:bg-teal-50 border border-slate-200"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.mark_attendance > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3"><span className="text-amber-600 text-xl">⚠️</span><p className="font-semibold text-amber-900 text-sm">You have pending attendance to mark for {tasks.mark_attendance} class(es).</p></div>
                                <button type="button" onClick={() => openTab("attendance")} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Mark Now</button>
                            </div>
                        )}
                        {tasks.upload_ca > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3"><span className="text-blue-600 text-xl">📊</span><p className="font-semibold text-blue-900 text-sm">CA Scores pending upload for {tasks.upload_ca} subject(s).</p></div>
                                <button type="button" onClick={() => openTab("ca_scores")} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Upload</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">My Classes</h3><button type="button" onClick={() => openTab("my_classes")} className="text-xs font-semibold text-teal-600 hover:underline">View All</button></div>
                        {classes.length === 0 ? <EmptyState title="No classes assigned" message="Assigned classes from the timetable will appear here." /> : (
                            <div className="divide-y divide-slate-100">{classes.map((c, idx) => (<div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center"><span className="font-semibold text-slate-800">{c.name}</span><span className="text-xs font-medium text-slate-500">{c.student_count} Students</span></div>))}</div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">My Subjects</h3><button type="button" onClick={() => openTab("my_subjects")} className="text-xs font-semibold text-teal-600 hover:underline">View All</button></div>
                        {subjects.length === 0 ? <EmptyState title="No subjects assigned" message="Assigned subjects from the timetable will appear here." /> : (
                            <div className="divide-y divide-slate-100">{subjects.map((s, idx) => (<div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center"><span className="font-semibold text-slate-800">{s.name}</span><span className="text-xs font-medium text-slate-500">{s.class}</span></div>))}</div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">Assignments</h3><span className="text-xs font-semibold text-slate-400">Unavailable</span></div>
                        <EmptyState title="No assignment data" message="Assignment management is not yet registered in the system." />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab.replace("_", " ")}</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">{TABS.find(t => t.id === activeTab)?.page ? "Opening the registered teacher workspace." : "This module is intentionally marked unavailable rather than displaying mock data."}</p>
                </div>
            )}
        </div>
    );
}
