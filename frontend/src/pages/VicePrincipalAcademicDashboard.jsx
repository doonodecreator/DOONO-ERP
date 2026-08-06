import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function VicePrincipalAcademicDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/vp-academic/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading VP Academic dashboard", err);
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

    const info = data?.academic_info || {};
    const metrics = data?.metrics || {};
    const assignments = data?.subject_assignments || [];
    const exams = data?.exam_schedule_summary || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "subjects", label: "Subjects" },
        { id: "assign_teachers", label: "Assign Teachers" },
        { id: "timetable", label: "Timetable" },
        { id: "examinations", label: "Examinations" },
        { id: "ca", label: "Continuous Assessment" },
        { id: "results_mgmt", label: "Results Management" },
        { id: "promotion", label: "Promotion" },
        { id: "academic_reports", label: "Academic Reports" },
        { id: "cbt_question_bank", label: "Question Bank (CBT)" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        📚
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">VP Academic Control Panel</h1>
                        <p className="text-sm text-slate-500">VP Academic: <span className="font-semibold text-slate-700">{info.vp_name}</span> • {info.school_name} ({info.session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + Create Subject Allocation
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Subjects</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_subjects || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Teachers</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.active_teachers || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CA Submitted</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.ca_submissions_pct || "0%"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CBT Questions</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.cbt_questions_count || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Results Review</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.pending_results_review || 0}</p>
                </div>
            </div>

            {/* Navigation Tabs (10 Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                                : "bg-white text-slate-600 hover:bg-teal-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subject Allocation Grid */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Subject Allocation Summary</h3>
                            <button onClick={() => setActiveTab('assign_teachers')} className="text-xs font-semibold text-teal-600 hover:underline">Assign More</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {assignments.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.subject}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.classes} • Teacher: <span className="font-semibold text-slate-700">{item.assigned_teacher}</span></p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${item.status === 'Assigned' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Examination Schedule Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Upcoming Exams</h3>
                            <button onClick={() => setActiveTab('examinations')} className="text-xs font-semibold text-teal-600 hover:underline">Manage</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {exams.map((exam, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{exam.title}</h4>
                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                        <span>Starts: {exam.start_date}</span>
                                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">{exam.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{tabs.find(t => t.id === activeTab)?.label} Sub-Module</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                        Academic tools and configuration interfaces for {tabs.find(t => t.id === activeTab)?.label} are loaded and ready.
                    </p>
                </div>
            )}
        </div>
    );
}
