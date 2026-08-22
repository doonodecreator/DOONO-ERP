import React, { useState, useEffect } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Overview" },
    { id: "timetable", label: "Timetable" },
    { id: "assignments", label: "Assignments" },
    { id: "results", label: "Results", page: "results" },
    { id: "library", label: "Library", page: "library" },
];

export default function StudentPortal({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

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
    const timetable = Array.isArray(data?.timetable) ? data.timetable : [];
    const timetableContext = data?.timetable_context || {};
    const notices = Array.isArray(data?.recent_notices) ? data.recent_notices : [];

    const downloadReportCard = async () => {
        setDownloading(true);
        setError("");
        try {
            const response = await api.get("/student/report-card/download", { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = "Latest_Report_Card.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err?.response?.data?.message || "No published report card is available yet.");
        } finally {
            setDownloading(false);
        }
    };

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
            return;
        }
        setActiveTab(tabId);
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
                        <button type="button" onClick={downloadReportCard} disabled={downloading} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{downloading ? "Preparing..." : "Download Report Card"}</button>
                    </div>
                }
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            {notices.length > 0 && <section className="mb-6 rounded-2xl border border-blue-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">School Notices</h2><p className="mt-1 text-sm text-slate-500">Important updates from your school.</p></div><div className="divide-y divide-slate-100">{notices.map((notice) => <article key={notice.id} className="p-5"><h3 className="font-semibold text-slate-900">{notice.subject}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{notice.body}</p><p className="mt-2 text-xs text-slate-400">{notice.published_at ? new Date(notice.published_at).toLocaleString() : "Recently published"}</p></article>)}</div></section>}

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
            ) : activeTab === "timetable" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5"><h2 className="text-xl font-bold text-slate-900">My Term Timetable</h2><p className="mt-1 text-sm text-slate-500">{timetableContext.academic_session || "Current session"} · {timetableContext.term || "Current term"} · {timetableContext.class || "Class"}{timetableContext.stream ? ` · ${timetableContext.stream}` : ""}</p></div>
                    {timetable.length === 0 ? <EmptyState title="No timetable published yet" message="Your school has not configured timetable entries for your current class and term." /> : <div className="space-y-3">{timetable.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{item.title || item.subject || "Schedule entry"}</p><p className="text-xs text-slate-500">{item.entry_type === "lesson" ? `${item.teacher || "Teacher not assigned"}${item.room ? ` · ${item.room}` : ""}` : item.description || item.entry_type}</p></div><div className="text-left text-xs font-semibold text-indigo-700 sm:text-right"><p>{item.day_of_week || item.event_date || item.effective_from || "Term event"}</p><p>{item.start_time && item.end_time ? `${item.start_time} – ${item.end_time}` : item.effective_until ? `Until ${item.effective_until}` : "All day"}</p></div></div></div>)}</div>}
                </div>
            ) : activeTab === "assignments" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Assignments</h2>
                    {assignments.length === 0 ? <EmptyState title="No upcoming assignments" message="Published assignments will appear here." /> : <div className="mt-4 divide-y divide-slate-100">{assignments.map((assignment) => <div key={assignment.id} className="py-4"><p className="font-semibold text-slate-800">{assignment.title}</p><p className="text-sm text-slate-500">{assignment.subject} · Due {assignment.due_date}</p></div>)}</div>}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Portal</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Opening the registered student workspace.</p>
                </div>
            )}
        </div>
    );
}
