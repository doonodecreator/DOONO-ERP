import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "classes", label: "JSS & SSS Classes", page: "classes" },
    { id: "teachers", label: "Secondary Teachers", page: "staff" },
    { id: "curriculum", label: "Curriculum & Subjects", page: "subjects" },
    { id: "external_exams", label: "External Exams (WAEC/NECO)", page: "external-exams" },
    { id: "results_approvals", label: "Results Approvals", page: "results" },
    { id: "discipline", label: "Student Discipline", page: "discipline-cases" },
    { id: "graduation", label: "Promotion & Graduation", page: "promotions" },
    { id: "reports", label: "Academic Reports", page: "report-cards" },
    { id: "communication", label: "Communication", page: "communication" },
];

const displayValue = (value, fallback = "Unavailable") => (
    value === null || value === undefined || value === "" ? fallback : value
);

export default function SecondaryPrincipalDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/secondary-head/dashboard");
                setData(response?.data && typeof response.data === "object" ? response.data : null);
            } catch (requestError) {
                setData(null);
                setError(requestError?.response?.data?.message || "Unable to load secondary dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const summary = data?.principal_summary && typeof data.principal_summary === "object" ? data.principal_summary : {};
    const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics : {};
    const streams = Array.isArray(data?.streams) ? data.streams : [];
    const results = Array.isArray(data?.recent_results) ? data.recent_results : [];

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
            return;
        }
        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading secondary dashboard..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title="Secondary Principal"
                subtitle={`${summary.principal_name || "Current user"} • ${summary.school_name || "Current school"} • ${summary.session || "Session unavailable"} / ${summary.term || "Term unavailable"}`}
                action={<button type="button" onClick={() => openTab("results_approvals")} className="btn-primary">Review Results</button>}
            />
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
                <div className="stat-card"><span>Total Students</span><strong>{displayValue(metrics.total_students, 0)}</strong></div>
                <div className="stat-card"><span>Secondary Teachers</span><strong>{displayValue(metrics.total_teachers, 0)}</strong></div>
                <div className="stat-card"><span>Active Classes</span><strong>{displayValue(metrics.active_classes, 0)}</strong></div>
                <div className="stat-card"><span>External Candidates</span><strong>{displayValue(metrics.waec_candidates)}</strong></div>
                <div className="stat-card"><span>Pending Approvals</span><strong>{displayValue(metrics.pending_results_approvals, 0)}</strong></div>
            </div>
            <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {TABS.map((tab) => <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${activeTab === tab.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"}`}>{tab.label}</button>)}
            </div>
            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Secondary Streams</h2><p className="text-xs text-slate-500 mt-1">Live stream enrollment counts. Stream heads and class totals are unavailable without registered assignment data.</p></div><button type="button" onClick={() => openTab("classes")} className="text-xs font-semibold text-indigo-600 hover:underline">Manage Classes</button></div>
                        {streams.length === 0 ? <EmptyState title="No secondary streams" message="Create streams and active enrollments to see the secondary overview." /> : <div className="divide-y divide-slate-100">{streams.map((stream) => <div key={stream.id || stream.name} className="flex items-center justify-between gap-4 p-4"><div><h3 className="font-semibold text-slate-800">{stream.name || "Stream unavailable"}</h3><p className="text-xs text-slate-500 mt-1">Classes: {displayValue(stream.classes_count)} • Stream Head: {stream.stream_head || "Unavailable"}</p></div><span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{displayValue(stream.students, 0)} Students</span></div>)}</div>}
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">External Exams</h2><p className="text-xs text-slate-500 mt-1">Plan WAEC, NECO, and other external examination activities.</p></div><button type="button" onClick={() => openTab("external_exams")} className="text-xs font-semibold text-indigo-600 hover:underline">Open workspace</button></div>
                        <EmptyState title="No external exam activities" message="Create an external examination activity to begin tracking candidates, dates, venues, and status." />
                    </section>
                    <section className="lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Result Submissions</h2><p className="text-xs text-slate-500 mt-1">Live secondary result-submission records.</p></div><button type="button" onClick={() => openTab("results_approvals")} className="text-xs font-semibold text-indigo-600 hover:underline">Review</button></div>
                        {results.length === 0 ? <EmptyState title="No result submissions" message="Secondary result submissions will appear here." /> : <div className="grid gap-3 p-4 md:grid-cols-2">{results.map((item) => <div key={item.id || `${item.class}-${item.date}`} className="rounded-lg border border-slate-100 p-4"><h3 className="font-semibold text-slate-800">{item.class || "Class unavailable"}</h3><p className="text-xs text-slate-500 mt-1">{item.type || "Result submission"}</p><div className="mt-2 flex items-center justify-between"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item.status || "Status unavailable"}</span><span className="text-[10px] text-slate-400">{item.date || "Date unavailable"}</span></div></div>)}</div>}
                    </section>
                </div>
            ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-xl font-bold text-slate-900">{TABS.find((tab) => tab.id === activeTab)?.label}</h2><p className="mt-2 text-sm text-slate-500">{TABS.find((tab) => tab.id === activeTab)?.page ? "Opening the registered secondary workspace." : activeTab === "external_exams" ? "Open the external examination planning workspace to create or review WAEC and NECO activities." : "Opening the registered workspace for this module."}</p></section>
            )}
        </div>
    );
}
