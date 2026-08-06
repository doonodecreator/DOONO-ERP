import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function SecondaryPrincipalDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/secondary-principal/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading Secondary Principal dashboard", err);
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

    const summary = data?.principal_summary || {};
    const metrics = data?.metrics || {};
    const streams = data?.streams || [];
    const exams = data?.external_exams_status || [];

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "classes", label: "JSS & SSS Classes" },
        { id: "teachers", label: "Secondary Teachers" },
        { id: "curriculum", label: "Curriculum & Subjects" },
        { id: "external_exams", label: "External Exams (WAEC/NECO)" },
        { id: "results_approvals", label: "Results Approvals" },
        { id: "discipline", label: "Student Discipline" },
        { id: "graduation", label: "Promotion & Graduation" },
        { id: "reports", label: "Academic Reports" },
        { id: "communication", label: "Communication" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-inner">
                        🎓
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Secondary Principal Portal</h1>
                        <p className="text-sm text-slate-500">Principal: <span className="font-semibold text-slate-700">{summary.principal_name}</span> • {summary.school_name} ({summary.session})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + Review Pending Results
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total_students || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secondary Teachers</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.total_teachers || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Classes</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.active_classes || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WAEC Candidates</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.waec_candidates || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.pending_results_approvals || 0}</p>
                </div>
            </div>

            {/* Navigation Bar (10 Sub-Modules) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Secondary Academic Streams */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Academic Streams Overview</h3>
                            <button onClick={() => setActiveTab('classes')} className="text-xs font-semibold text-indigo-600 hover:underline">Manage Classes</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {streams.map((stream, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{stream.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Stream Head: <span className="font-semibold text-slate-700">{stream.stream_head}</span> • {stream.classes_count} Classes</p>
                                    </div>
                                    <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-md font-bold">
                                        {stream.students} Students
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* External Examinations Status Widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">External Exams Portal</h3>
                            <button onClick={() => setActiveTab('external_exams')} className="text-xs font-semibold text-indigo-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {exams.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 text-sm">{item.exam}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Registered Candidates: <span className="font-bold text-slate-700">{item.candidates}</span></p>
                                    <span className="inline-block mt-2 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                                        {item.status}
                                    </span>
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
                        Secondary school administration controls for {tabs.find(t => t.id === activeTab)?.label} are active in this workspace.
                    </p>
                </div>
            )}
        </div>
    );
}
