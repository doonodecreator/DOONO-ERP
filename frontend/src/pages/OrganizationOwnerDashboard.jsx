import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function OrganizationOwnerDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadOrgData();
    }, []);

    const loadOrgData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/org-owner/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading org owner dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const org = data?.organization_profile || {};
    const schools = data?.schools || [];
    const finances = data?.financial_summary || {};
    const leadership = data?.leadership_staff || [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {/* Group Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold">
                        🏢
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                        <p className="text-sm text-slate-500">Organization Owner • {org.owner_name} • {org.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        + Add New School Branch
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{finances.total_revenue_collected || "₦0"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Outstanding Fees</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{finances.outstanding_fees || "₦0"}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Payroll Expense</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{finances.payroll_expenses || "₦0"}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["dashboard", "my schools", "leadership team", "billing & subscription", "reports"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200"}`}>
                        {tab === "dashboard" ? "Overview" : tab}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Schools List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Schools Under Organization</h3>
                            <button onClick={() => setActiveTab('my schools')} className="text-xs font-semibold text-emerald-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {schools.map((s) => (
                                <div key={s.id} className="p-5 hover:bg-slate-50 flex justify-between items-center transition-colors">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base">{s.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{s.students} Students • {s.staff} Staff Members</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-bold">{s.status}</span>
                                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200">Manage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Group Leadership Staff */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Group Leadership</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {leadership.map((l, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50">
                                    <p className="font-semibold text-slate-800 text-sm">{l.name}</p>
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">{l.role}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{l.school}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Management</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">This panel handles multi-tenant group options for {activeTab}.</p>
                </div>
            )}
        </div>
    );
}
