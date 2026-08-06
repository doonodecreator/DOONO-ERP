import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function StudentPortal() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadStudentData();
    }, []);

    const loadStudentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/student/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading student dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const student = data?.student_profile || {};
    const assignments = data?.upcoming_assignments || [];
    const results = data?.recent_results || [];
    const attendance = data?.attendance_summary || { present: 0, absent: 0 };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
                        {student.first_name?.charAt(0) || 'S'}{student.last_name?.charAt(0) || ''}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Hi, {student.first_name} {student.last_name}!</h1>
                        <p className="text-sm text-slate-500">Student Portal • {student.class?.name || 'Class Unassigned'} • {student.admission_number}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Present</p>
                        <p className="text-lg font-bold text-emerald-700">{attendance.present} Days</p>
                    </div>
                    <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 text-center">
                        <p className="text-xs font-semibold text-rose-600 uppercase">Absent</p>
                        <p className="text-lg font-bold text-rose-700">{attendance.absent} Days</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["dashboard", "timetable", "assignments", "results", "library"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"}`}>
                        {tab === "dashboard" ? "Overview" : tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assignments Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Upcoming Assignments</h3>
                            <button onClick={() => setActiveTab('assignments')} className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {assignments.length > 0 ? assignments.map(a => (
                                <div key={a.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-slate-800">{a.title}</h4>
                                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Due: {a.due_date}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{a.subject}</p>
                                </div>
                            )) : (
                                <div className="p-5 text-center text-sm text-slate-500">No upcoming assignments.</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Results Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Test Scores</h3>
                            <button onClick={() => setActiveTab('results')} className="text-xs font-semibold text-blue-600 hover:underline">View Full Result</button>
                        </div>
                        <div className="p-5">
                            <div className="space-y-4">
                                {results.length > 0 ? results.map((r, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{r.subject}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${r.score >= 70 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${r.score}%` }}></div>
                                            </div>
                                            <span className="font-bold text-slate-700 w-8 text-right">{r.score}%</span>
                                            <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{r.grade}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-sm text-slate-500">No recent results published.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Portal</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">This section is currently being wired up to the backend. Check back soon for your {activeTab} data!</p>
                </div>
            )}
        </div>
    );
}
