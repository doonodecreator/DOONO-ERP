import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function ParentPortal() {
    const [activeTab, setActiveTab] = useState("children");
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        loadParentData();
    }, []);

    const loadParentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/parent/dashboard");
            setDashboardData(res.data);
        } catch (err) {
            console.error("Error loading parent dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const parent = dashboardData?.parent_profile || { first_name: "Parent", last_name: "" };
    const children = dashboardData?.children || [];
    const notices = dashboardData?.recent_notices || [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-bold">
                        {parent.first_name?.charAt(0) || 'P'}{parent.last_name?.charAt(0) || ''}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome, {parent.first_name} {parent.last_name}</h1>
                        <p className="text-sm text-slate-500">Parent / Guardian Portal</p>
                    </div>
                </div>
                <div className="bg-rose-50 px-5 py-3 rounded-xl border border-rose-100 text-right">
                    <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Total Outstanding Fees</p>
                    <p className="text-xl font-bold text-rose-700">₦{dashboardData?.outstanding_fees?.toLocaleString() || "0.00"}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["children", "fees", "attendance", "notices"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200"}`}>
                        {tab === "children" ? "My Children" : tab === "fees" ? "Fees & Payments" : tab === "attendance" ? "Attendance" : "School Notices"}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "children" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {children.length > 0 ? children.map(child => (
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
                                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors">View Result</button>
                                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors">Timetable</button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                            <p className="text-slate-500">No children linked to this account yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "notices" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Recent School Notices</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {notices.map(notice => (
                            <div key={notice.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{notice.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Posted on: {notice.date}</p>
                                    </div>
                                </div>
                                <button className="text-indigo-600 text-sm font-semibold hover:underline">Read</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(activeTab === "fees" || activeTab === "attendance") && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{activeTab === 'fees' ? 'Fee Statements' : 'Attendance Records'}</h3>
                    <p className="text-sm text-slate-500">This module is currently being connected to the main backend. Check back soon!</p>
                </div>
            )}
        </div>
    );
}
