import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function OrganizationOwnerDashboard({ setPage }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrgData();
    }, []);

    const loadOrgData = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await api.get("/org-owner/dashboard");
            setData(res?.data || null);
        } catch (err) {
            setData(null);
            setError(err.message || "Unable to load the organization dashboard.");
        } finally {
            setLoading(false);
        }
    };

    const openTab = (tabId) => {
        const pageMap = {
            my_schools: "schools",
            leadership_team: "staff",
            billing_subscription: "subscriptions",
            reports: "report-cards",
        };

        if (pageMap[tabId] && setPage) {
            setPage(pageMap[tabId]);
            return;
        }

        setActiveTab(tabId);
    };

    if (loading) {
        return <LoadingSpinner text="Loading organization dashboard..." />;
    }

    const org = data?.organization_profile && typeof data.organization_profile === "object" ? data.organization_profile : {};
    const finances = data?.financial_summary && typeof data.financial_summary === "object" ? data.financial_summary : {};
    const schools = Array.isArray(data?.schools) ? data.schools : [];
    const leadership = Array.isArray(data?.leadership_staff) ? data.leadership_staff : [];
    const tabs = [
        { id: "dashboard", label: "Overview" },
        { id: "my_schools", label: "My Schools" },
        { id: "leadership_team", label: "Leadership Team" },
        { id: "billing_subscription", label: "Billing & Subscription" },
        { id: "reports", label: "Reports" },
    ];

    const formatMoney = (value) => {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: finances.currency || "NGN",
            maximumFractionDigits: 0,
        }).format(Number(value));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {error && <div role="alert" className="error-message mb-4">{error}</div>}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                        Organization
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{org.name || "Organization Owner"}</h1>
                        <p className="text-sm text-slate-500">
                            Owner: <span className="font-semibold text-slate-700">{org.owner_name || "Current user"}</span>
                            {org.code ? ` • ${org.code}` : ""}
                            {org.school_count !== undefined ? ` • ${org.school_count} school${org.school_count === 1 ? "" : "s"}` : ""}
                        </p>
                        {(org.active_plan || org.renewal_date) && (
                            <p className="text-xs text-slate-500 mt-1">
                                {org.active_plan || "No active plan"}
                                {org.renewal_date ? ` • Renewal: ${org.renewal_date}` : ""}
                            </p>
                        )}
                    </div>
                </div>
                <button type="button" onClick={() => setPage?.("add-school")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    + Add New School Branch
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{formatMoney(finances.total_revenue_collected)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Outstanding Fees</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{formatMoney(finances.outstanding_fees)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payroll Expense</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{formatMoney(finances.payroll_expenses)}</p>
                    {finances.payroll_expenses === null && <p className="text-xs text-slate-400 mt-1">No verified payroll category is available.</p>}
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => openTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Schools Under Organization</h3>
                            <button type="button" onClick={() => openTab("my_schools")} className="text-xs font-semibold text-emerald-600 hover:underline">View All</button>
                        </div>
                        {schools.length === 0 ? (
                            <EmptyState title="No schools found" message="Schools owned by this organization will appear here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {schools.map((school) => (
                                    <div key={school.id} className="p-5 hover:bg-slate-50 flex justify-between items-center transition-colors gap-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-base">{school.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{school.students} Students • {school.staff} Staff Members</p>
                                            {(school.active_plan || school.renewal_date) && <p className="text-xs text-slate-400 mt-1">{school.active_plan || "No active plan"}{school.renewal_date ? ` • Renewal: ${school.renewal_date}` : ""}</p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-bold">{school.status || "Unknown"}</span>
                                            <button type="button" onClick={() => openTab("my_schools")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200">Manage</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Group Leadership</h3>
                        </div>
                        {leadership.length === 0 ? (
                            <EmptyState title="No leadership records" message="Active school leadership staff will appear here." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {leadership.map((member) => (
                                    <div key={`${member.name}-${member.school}`} className="p-4 hover:bg-slate-50">
                                        <p className="font-semibold text-slate-800 text-sm">{member.name || "Unnamed staff"}</p>
                                        <p className="text-xs text-emerald-600 font-medium mt-0.5">{member.role || "Designation unavailable"}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{member.school || "School unavailable"}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
