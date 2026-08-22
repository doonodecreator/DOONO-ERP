import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TAB_CONFIG = [
    { id: "dashboard", label: "Dashboard" },
    { id: "subjects", label: "Subjects", page: "subjects" },
    { id: "assign_teachers", label: "Assign Teachers", page: "staff" },
    { id: "timetable", label: "Timetable", page: "timetable" },
    { id: "examinations", label: "Examinations", page: "examinations" },
    { id: "ca", label: "Continuous Assessment", page: "result-entry" },
    { id: "results_mgmt", label: "Results Management", page: "results" },
    { id: "promotion", label: "Promotion", page: "promotions" },
    { id: "academic_reports", label: "Academic Reports", page: "report-cards" },
    { id: "cbt_question_bank", label: "Question Bank (CBT)", page: "cbt" },
];

const formatMetric = (value, fallback = "Not configured") => (
    value === null || value === undefined || value === "" ? fallback : value
);

export default function VicePrincipalAcademicDashboard({ setPage }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/vp-academic/dashboard");
            setData(response?.data && typeof response.data === "object" ? response.data : null);
        } catch (requestError) {
            setData(null);
            setError(requestError?.response?.data?.message || "Unable to load academic dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const assignments = Array.isArray(data?.subject_assignments) ? data.subject_assignments : [];
    const exams = Array.isArray(data?.exam_schedule_summary) ? data.exam_schedule_summary : [];
    const info = data?.academic_info && typeof data.academic_info === "object" ? data.academic_info : {};
    const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics : {};
    const activeTabConfig = useMemo(
        () => TAB_CONFIG.find((tab) => tab.id === activeTab) || TAB_CONFIG[0],
        [activeTab]
    );

    const openTab = (tabId) => {
        const tab = TAB_CONFIG.find((item) => item.id === tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
            return;
        }
        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading academic dashboard..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title="Vice Principal Academic"
                subtitle={`${info.vp_name || "Current user"} • ${info.school_name || "Current school"} • ${info.session || "Session not configured"} / ${info.term || "Term not configured"}`}
                action={(
                    <button
                        type="button"
                        onClick={() => openTab("subjects")}
                        className="btn-primary"
                    >
                        Manage Subjects
                    </button>
                )}
            />

            {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
                <div className="stat-card"><span>Total Subjects</span><strong>{formatMetric(metrics.total_subjects, 0)}</strong></div>
                <div className="stat-card"><span>Active Teachers</span><strong>{formatMetric(metrics.active_teachers, 0)}</strong></div>
                <div className="stat-card"><span>Result Submissions</span><strong>{metrics.ca_submissions_pct === null || metrics.ca_submissions_pct === undefined ? "0%" : `${metrics.ca_submissions_pct}%`}</strong></div>
                <div className="stat-card"><span>CBT Questions</span><strong>{formatMetric(metrics.cbt_questions_count)}</strong></div>
                <div className="stat-card"><span>Results Review</span><strong>{formatMetric(metrics.pending_results_review, 0)}</strong></div>
            </div>

            <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => openTab(tab.id)}
                        className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${activeTab === tab.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h2 className="font-bold text-slate-900">Subject Coverage</h2>
                                <p className="text-xs text-slate-500 mt-1">Live subjects and linked classes; teacher allocation is not registered in the current data model.</p>
                            </div>
                            <button type="button" onClick={() => openTab("subjects")} className="text-xs font-semibold text-teal-600 hover:underline">Manage Subjects</button>
                        </div>
                        {assignments.length === 0 ? (
                            <EmptyState title="No active subjects" message="Create or activate subjects for this school to see coverage here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {assignments.map((item) => (
                                    <div key={item.subject} className="flex items-center justify-between gap-4 p-4">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{item.subject}</h3>
                                            <p className="text-xs text-slate-500 mt-1">Classes: {item.classes || "No classes linked"}</p>
                                        </div>
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.status || "Not assigned"}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h2 className="font-bold text-slate-900">Upcoming Examinations</h2>
                                <p className="text-xs text-slate-500 mt-1">School-scoped examination records.</p>
                            </div>
                            <button type="button" onClick={() => openTab("examinations")} className="text-xs font-semibold text-teal-600 hover:underline">View</button>
                        </div>
                        {exams.length === 0 ? (
                            <EmptyState title="No upcoming examinations" message="Create an examination to show its schedule here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {exams.map((exam) => (
                                    <div key={exam.id || `${exam.title}-${exam.start_date}`} className="p-4">
                                        <h3 className="font-semibold text-slate-800">{exam.title || "Untitled examination"}</h3>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                                            <span>{exam.start_date || "Date unavailable"}</span>
                                            <span className="rounded bg-teal-50 px-2 py-1 font-semibold text-teal-700">{exam.status || "Status unavailable"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">{activeTabConfig.label}</h2>
                    {activeTabConfig.page ? (
                        <p className="mt-2 text-sm text-slate-500">Opening the registered {activeTabConfig.label.toLowerCase()} workspace.</p>
                    ) : activeTab === "examinations" ? (
                        <p className="mt-2 text-sm text-slate-500">Opening the registered examination workspace.</p>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500">Opening the registered academic workspace.</p>
                    )}
                </section>
            )}
        </div>
    );
}
