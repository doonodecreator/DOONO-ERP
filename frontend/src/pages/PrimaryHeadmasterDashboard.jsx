import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "primary_classes", label: "Primary Classes", page: "classes" },
    { id: "primary_teachers", label: "Primary Teachers", page: "staff" },
    { id: "subjects", label: "Subjects", page: "subjects" },
    { id: "attendance", label: "Attendance", page: "attendance" },
    { id: "assessment", label: "Assessment", page: "result-entry" },
    { id: "results", label: "Results", page: "results" },
    { id: "promotion", label: "Promotion", page: "promotions" },
    { id: "reports", label: "Reports", page: "report-cards" },
    { id: "communication", label: "Communication" },
];

const displayValue = (value, fallback = "Unavailable") => (
    value === null || value === undefined || value === "" ? fallback : value
);

export default function PrimaryHeadmasterDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/primary-headmaster/dashboard");
                setData(response?.data && typeof response.data === "object" ? response.data : null);
            } catch (requestError) {
                setData(null);
                setError(requestError?.response?.data?.message || "Unable to load primary dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const summary = data?.headmaster_summary && typeof data.headmaster_summary === "object" ? data.headmaster_summary : {};
    const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics : {};
    const classesList = Array.isArray(data?.classes) ? data.classes : [];
    const results = Array.isArray(data?.recent_results) ? data.recent_results : [];

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        setActiveTab(tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading primary dashboard..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title="Primary Headmaster"
                subtitle={`${summary.headmaster_name || "Current user"} • ${summary.school_name || "Current school"} • ${summary.session || "Session unavailable"} / ${summary.term || "Term unavailable"}`}
                action={<button type="button" onClick={() => openTab("promotion")} className="btn-primary">Manage Promotion</button>}
            />
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
                <div className="stat-card"><span>Primary Pupils</span><strong>{displayValue(metrics.total_pupils, 0)}</strong></div>
                <div className="stat-card"><span>Primary Teachers</span><strong>{displayValue(metrics.total_teachers, 0)}</strong></div>
                <div className="stat-card"><span>Primary Classes</span><strong>{displayValue(metrics.primary_classes, 0)}</strong></div>
                <div className="stat-card"><span>Attendance Rate</span><strong>{metrics.today_attendance_pct === null || metrics.today_attendance_pct === undefined ? "Unavailable" : `${metrics.today_attendance_pct}%`}</strong></div>
                <div className="stat-card"><span>Results Review</span><strong>{displayValue(metrics.result_submissions_pending_review, 0)}</strong></div>
            </div>
            <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {TABS.map((tab) => <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${activeTab === tab.id ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-200"}`}>{tab.label}</button>)}
            </div>
            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Primary Classes</h2><p className="text-xs text-slate-500 mt-1">Live classes and active pupil counts. Form-teacher allocation is not present in the current class model.</p></div><button type="button" onClick={() => openTab("primary_classes")} className="text-xs font-semibold text-orange-600 hover:underline">Manage All</button></div>
                        {classesList.length === 0 ? <EmptyState title="No primary classes" message="Create or activate primary divisions and classes to see them here." /> : <div className="divide-y divide-slate-100">{classesList.map((item) => <div key={item.id || item.name} className="flex items-center justify-between gap-4 p-4"><div><h3 className="font-semibold text-slate-800">{item.name || "Unnamed class"}</h3><p className="text-xs text-slate-500 mt-1">Form Teacher: {item.teacher || "Unavailable"}</p></div><span className="rounded-md bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{displayValue(item.pupils, 0)} Pupils</span></div>)}</div>}
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Result Submissions</h2><p className="text-xs text-slate-500 mt-1">Live primary result-submission records.</p></div><button type="button" onClick={() => openTab("results")} className="text-xs font-semibold text-orange-600 hover:underline">Review</button></div>
                        {results.length === 0 ? <EmptyState title="No result submissions" message="Primary result submissions will appear here." /> : <div className="divide-y divide-slate-100">{results.map((item) => <div key={item.id || `${item.class}-${item.date}`} className="p-4"><h3 className="font-semibold text-slate-800">{item.class || "Class unavailable"}</h3><p className="text-xs text-slate-500 mt-1">{item.type || "Result submission"}</p><div className="mt-2 flex items-center justify-between"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item.status || "Status unavailable"}</span><span className="text-[10px] text-slate-400">{item.date || "Date unavailable"}</span></div></div>)}</div>}
                    </section>
                </div>
            ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-xl font-bold text-slate-900">{TABS.find((tab) => tab.id === activeTab)?.label}</h2><p className="mt-2 text-sm text-slate-500">{activeTab === "promotion" ? data?.promotion_status?.message || "The promotion workflow has no pending approval state in the current contract." : TABS.find((tab) => tab.id === activeTab)?.page ? "Opening the registered primary workspace." : "No verified communication workspace is registered yet; this control is intentionally unavailable."}</p></section>
            )}
        </div>
    );
}
