import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadTeacherData();
    }, []);

    const loadTeacherData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/teacher/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading teacher dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const teacher = data?.teacher_profile || {};
    const classes = data?.my_classes || [];
    const subjects = data?.my_subjects || [];
    const assignments = data?.recent_assignments || [];
    const tasks = data?.pending_tasks || { upload_ca: 0, mark_attendance: 0 };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl font-bold">
                        {teacher.first_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome, {teacher.first_name} {teacher.last_name}</h1>
                        <p className="text-sm text-slate-500">Teacher Portal • {teacher.department || 'General'} Dept • {teacher.employee_id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + New Assignment
                    </button>
                    <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        Upload CA Scores
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["dashboard", "my classes", "my subjects", "attendance", "assignments", "ca scores"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-white text-slate-600 hover:bg-teal-50 border border-slate-200"}`}>
                        {tab === "dashboard" ? "Overview" : tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action Alerts */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.mark_attendance > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-amber-600 text-xl">⚠️</span>
                                    <p className="font-semibold text-amber-900 text-sm">You have pending attendance to mark for {tasks.mark_attendance} class(es).</p>
                                </div>
                                <button className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Mark Now</button>
                            </div>
                        )}
                        {tasks.upload_ca > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-600 text-xl">📊</span>
                                    <p className="font-semibold text-blue-900 text-sm">CA Scores pending upload for {tasks.upload_ca} subject(s).</p>
                                </div>
                                <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Upload</button>
                            </div>
                        )}
                    </div>

                    {/* Classes Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">My Classes</h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{classes.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {classes.map(c => (
                                <div key={c.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <span className="font-semibold text-slate-800">{c.name}</span>
                                    <span className="text-xs font-medium text-slate-500">{c.student_count} Students</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subjects Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">My Subjects</h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{subjects.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {subjects.map(s => (
                                <div key={s.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <span className="font-semibold text-slate-800">{s.name}</span>
                                    <span className="text-xs font-medium text-slate-500">{s.class}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assignments Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Active Assignments</h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{assignments.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {assignments.map(a => (
                                <div key={a.id} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{a.title}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-medium text-slate-500">{a.class}</span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Due: {a.due_date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Interface</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">This section handles the detailed view for {activeTab}. Check back as we wire up the full data grid!</p>
                </div>
            )}
        </div>
    );
}
