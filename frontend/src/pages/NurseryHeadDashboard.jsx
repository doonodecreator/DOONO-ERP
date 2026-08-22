import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "pupils", label: "Nursery Pupils", page: "students" },
    { id: "teachers", label: "Nursery Teachers", page: "staff" },
    { id: "classes", label: "Nursery Classes", page: "classes" },
    { id: "assessment", label: "Assessment", page: "result-entry" },
    { id: "attendance", label: "Attendance", page: "attendance" },
    { id: "timetable", label: "Timetable", page: "timetable" },
    { id: "reports", label: "Reports", page: "report-cards" },
    { id: "communication", label: "Communication", page: "communication" },
];

const displayValue = (value, fallback = "Unavailable") => (
    value === null || value === undefined || value === "" ? fallback : value
);

export default function NurseryHeadDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/nursery-head/dashboard");
                setData(response?.data && typeof response.data === "object" ? response.data : null);
            } catch (requestError) {
                setData(null);
                setError(requestError?.response?.data?.message || "Unable to load nursery dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const summary = data?.nursery_summary && typeof data.nursery_summary === "object" ? data.nursery_summary : {};
    const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics : {};
    const classesList = Array.isArray(data?.classes) ? data.classes : [];
    const assessments = Array.isArray(data?.recent_assessments) ? data.recent_assessments : [];

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
            return;
        }
        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading nursery dashboard..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title="Nursery Head"
                subtitle={`${summary.head_name || "Current user"} • ${summary.school_name || "Current school"} • ${summary.session || "Session unavailable"} / ${summary.term || "Term unavailable"}`}
                action={<button type="button" onClick={() => setPage?.("add-student")} className="btn-primary">Register New Pupil</button>}
            />
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
                <div className="stat-card"><span>Nursery Pupils</span><strong>{displayValue(metrics.total_pupils, 0)}</strong></div>
                <div className="stat-card"><span>Teachers</span><strong>{displayValue(metrics.total_teachers, 0)}</strong></div>
                <div className="stat-card"><span>Classes</span><strong>{displayValue(metrics.nursery_classes, 0)}</strong></div>
                <div className="stat-card"><span>Attendance Rate</span><strong>{metrics.today_attendance_pct === null || metrics.today_attendance_pct === undefined ? "Unavailable" : `${metrics.today_attendance_pct}%`}</strong></div>
                <div className="stat-card"><span>Pending Assessments</span><strong>{displayValue(metrics.pending_assessments, 0)}</strong></div>
            </div>
            <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {TABS.map((tab) => <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${activeTab === tab.id ? "bg-pink-600 text-white border-pink-600" : "bg-white text-slate-600 border-slate-200"}`}>{tab.label}</button>)}
            </div>
            {activeTab === "dashboard" ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Nursery Classes</h2><p className="text-xs text-slate-500 mt-1">Live classes and active pupil counts. Teacher allocation is not present in the current class model.</p></div><button type="button" onClick={() => openTab("classes")} className="text-xs font-semibold text-pink-600 hover:underline">View All</button></div>
                        {classesList.length === 0 ? <EmptyState title="No nursery classes" message="Create or activate nursery divisions and classes to see them here." /> : <div className="divide-y divide-slate-100">{classesList.map((item) => <div key={item.id || item.name} className="flex items-center justify-between gap-4 p-4"><div><h3 className="font-semibold text-slate-800">{item.name || "Unnamed class"}</h3><p className="text-xs text-slate-500 mt-1">Teacher: {item.teacher || "Unavailable"}</p></div><span className="rounded-md bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">{displayValue(item.pupils, 0)} Pupils</span></div>)}</div>}
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-bold text-slate-900">Recent Assessments</h2><p className="text-xs text-slate-500 mt-1">Live result submissions for nursery classes.</p></div><button type="button" onClick={() => openTab("assessment")} className="text-xs font-semibold text-pink-600 hover:underline">Manage</button></div>
                        {assessments.length === 0 ? <EmptyState title="No assessment submissions" message="Submitted nursery assessments will appear here." /> : <div className="divide-y divide-slate-100">{assessments.map((item) => <div key={item.id || `${item.title}-${item.date}`} className="p-4"><h3 className="font-semibold text-slate-800">{item.title || "Assessment submission"}</h3><p className="text-xs text-slate-500 mt-1">Class: {item.class || "Unavailable"} • {item.date || "Date unavailable"}</p><span className="mt-2 inline-block rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item.status || "Status unavailable"}</span></div>)}</div>}
                    </section>
                </div>
            ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-xl font-bold text-slate-900">{TABS.find((tab) => tab.id === activeTab)?.label}</h2><p className="mt-2 text-sm text-slate-500">{TABS.find((tab) => tab.id === activeTab)?.page ? "Opening the registered nursery workspace." : "Select a registered nursery module from the navigation above."}</p></section>
            )}
        </div>
    );
}
