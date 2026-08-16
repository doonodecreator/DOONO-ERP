import React, { useState, useEffect } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageHeader from "../components/layout/PageHeader";

const TABS = [
    { id: "children", label: "My Children" },
    { id: "fees", label: "Fees & Payments", page: "finance" },
    { id: "attendance", label: "Attendance", page: "attendance" },
    { id: "notices", label: "School Notices" },
];

export default function ParentPortal({ setPage }) {
    const [activeTab, setActiveTab] = useState("children");
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadParentData = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await api.get("/parent/dashboard");
                setDashboardData(res?.data && typeof res.data === "object" ? res.data : null);
            } catch (err) {
                setDashboardData(null);
                setError(err?.response?.data?.message || "Unable to load parent portal data.");
            } finally {
                setLoading(false);
            }
        };
        loadParentData();
    }, []);

    const parent = dashboardData?.parent_profile || { first_name: "Parent", last_name: "" };
    const children = Array.isArray(dashboardData?.children) ? dashboardData.children : [];
    const notices = Array.isArray(dashboardData?.recent_notices) ? dashboardData.recent_notices : [];
    const outstandingFees = Number(dashboardData?.outstanding_fees || 0);

    const openTab = (tabId) => {
        const tab = TABS.find((item) => item.id === tabId);
        setActiveTab(tabId);
        if (tab?.page && typeof setPage === "function") {
            setPage(tab.page);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading parent portal..." />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title={`Welcome, ${parent.first_name || parent.display_name || "Parent"} ${parent.last_name || ""}`}
                subtitle="Parent / Guardian Portal"
                action={
                    <div className="bg-rose-50 px-5 py-2.5 rounded-xl border border-rose-100 text-right">
                        <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide">Total Outstanding Fees</p>
                        <p className="text-lg font-bold text-rose-700">₦{outstandingFees.toLocaleString()}</p>
                    </div>
                }
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "children" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {children.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState title="No children linked to this account" message="Linked student accounts will appear here once connected by the school." />
                        </div>
                    ) : (
                        children.map(child => (
                            <div key={child.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-10 group-hover:bg-indigo-100 transition-colors"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{child.first_name} {child.last_name}</h3>
                                        <p className="text-xs font-mono text-slate-500">ID: {child.admission_number || 'N/A'}</p>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">Active</span>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                                    <p><span className="font-semibold text-slate-400">Class:</span> {child.class?.name || 'Unassigned'}</p>
                                    <p><span className="font-semibold text-slate-400">Gender:</span> {child.gender || 'N/A'}</p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button type="button" onClick={() => openTab("fees")} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors">View Fees</button>
                                    <button type="button" onClick={() => openTab("attendance")} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors">Attendance</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === "notices" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-900">Recent School Notices</h3></div>
                    {notices.length === 0 ? (
                        <EmptyState title="No notices posted" message="School announcements and circulars will appear here." />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notices.map(notice => (
                                <div key={notice.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                        </div>
                                        <div><h4 className="font-semibold text-slate-800">{notice.title}</h4><p className="text-xs text-slate-500 mt-0.5">Posted on: {notice.date}</p></div>
                                    </div>
                                    <span className="text-indigo-600 text-sm font-semibold">Read</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {(activeTab === "fees" || activeTab === "attendance") && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab === 'fees' ? 'Fees & Payments' : 'Attendance Records'}</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Opening the registered {activeTab} workspace.</p>
                </div>
            )}
        </div>
    );
}
