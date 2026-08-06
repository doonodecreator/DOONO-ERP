import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function PlatformOwnerDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadPlatformData();
    }, []);

    const loadPlatformData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/platform-owner/dashboard");
            setData(res.data);
        } catch (err) {
            console.error("Error loading platform owner dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const stats = data?.system_stats || {};
    const orgs = data?.organizations || [];
    const plans = data?.subscription_plans || [];
    const activity = data?.recent_activity || [];

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-6 text-slate-100">
            {/* SaaS Master Header */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl font-black">
                        ⚡
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">DONO Platform Control Centre</h1>
                        <p className="text-sm text-slate-400">Software Owner Portal • Global System Administration</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {stats.system_health || "System Operational"}
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organizations</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total_organizations || 0}</p>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Schools</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.total_schools || 0}</p>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active_subscriptions || 0}</p>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRR Revenue</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{stats.mrr || "$0"}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["dashboard", "organizations", "schools", "subscriptions", "system health", "audit logs"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700/50 border border-slate-700"}`}>
                        {tab === "dashboard" ? "Overview" : tab}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Organizations Summary */}
                    <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-white">Registered Organizations</h3>
                            <button onClick={() => setActiveTab('organizations')} className="text-xs font-semibold text-indigo-400 hover:underline">Manage All</button>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {orgs.map((o) => (
                                <div key={o.id} className="p-4 hover:bg-slate-700/30 flex justify-between items-center transition-colors">
                                    <div>
                                        <p className="font-semibold text-white text-sm">{o.name}</p>
                                        <p className="text-xs text-slate-400">{o.schools_count} Associated Schools</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold">{o.plan}</span>
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded">{o.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Subscription Tiers */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                        <div className="p-5 border-b border-slate-700">
                            <h3 className="font-bold text-white">Subscription Tiers</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {plans.map((p, idx) => (
                                <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white text-sm">{p.name}</p>
                                        <p className="text-xs text-indigo-400 font-semibold">{p.price}</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{p.subscribers} Tenants</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== "dashboard" && (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                    <h3 className="text-xl font-bold text-white mb-2 capitalize">{activeTab} Control</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">This section manages global SaaS configuration for {activeTab}. Live data feeds will sync upon authentication setup.</p>
                </div>
            )}
        </div>
    );
}
