import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function FormTeacherDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/form-teacher/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading form teacher dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const profile = data?.profile || {};
    const students = data?.class_students || [];
    const tasks = data?.pending_tasks || { behaviour_reports: 0, parent_messages: 0 };
    const logs = data?.recent_behaviour_logs || [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-2xl font-bold">
                        {profile.first_name?.charAt(0) || 'F'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Form Master: {profile.first_name}</h1>
                        <p className="text-sm text-slate-500">Class: {profile.form_class || 'Unassigned'} • {profile.total_students || 0} Students</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        Mark Form Attendance
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["dashboard", "my class", "attendance", "behaviour", "parents", "recommendations"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-slate-600 hover:bg-violet-50 border border-slate-200"}`}>
                        {tab === "dashboard" ? "Overview" : tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action Alerts */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.behaviour_reports > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-rose-600 text-xl">🚩</span>
                                    <p className="font-semibold text-rose-900 text-sm">You have {tasks.behaviour_reports} pending behaviour reports to review.</p>
                                </div>
                                <button className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Review</button>
                            </div>
                        )}
                        {tasks.parent_messages > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-600 text-xl">💬</span>
                                    <p className="font-semibold text-blue-900 text-sm">{tasks.parent_messages} unread messages from parents.</p>
                                </div>
                                <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Inbox</button>
                            </div>
                        )}
                    </div>

                    {/* Class Roster Widget */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Form Class Roster ({profile.form_class})</h3>
                            <button onClick={() => setActiveTab('my class')} className="text-xs font-semibold text-violet-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {students.map(s => (
                                <div key={s.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.admission_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Attendance</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${s.attendance_rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${s.attendance_rate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{s.attendance_rate}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Behaviour Logs Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Recent Behaviour Logs</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {logs.length > 0 ? logs.map((log, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-slate-800 text-sm">{log.student}</h4>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">{log.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{log.incident}</p>
                                    <p className="text-[10px] text-slate-400 mt-2">{log.date}</p>
                                </div>
                            )) : (
                                <div className="p-5 text-center text-sm text-slate-500">No recent behaviour logs.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Interface</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">This section handles the detailed view for {activeTab}. Check back as we wire up the full data grid!</p>
                </div>
            )}
        </div>
    );
}
