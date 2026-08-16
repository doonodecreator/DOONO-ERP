import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import DataTable from "../components/tables/DataTable";

export default function Subscriptions() {
    const { isPlatformAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("plans");
    const [plans, setPlans] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [plansRes, subRes] = await Promise.all([
                api.get("/subscription-plans"),
                api.get("/my-subscription")
            ]);
            // Handle both paginated and flat data
            setPlans(plansRes.data?.data?.data ?? plansRes.data?.data ?? []);
            setMySub(subRes.data?.data || null);
        } catch (err) {
            setError("Failed to load subscription details.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRenew() {
        try {
            const res = await api.post("/payments/initialize-subscription");
            if (res.data?.data?.authorization_url) {
                window.location.href = res.data.data.authorization_url;
            }
        } catch (err) {
            alert(err.response?.data?.message || "Renewal failed.");
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    // --- VIEW 1: SUPER ADMIN (Full Management) ---
    if (isPlatformAdmin) {
        return (
            <PageContainer>
                <PageHeader title="Subscription Management" subtitle="Software Owner Master Control Panel" />
                <div className="flex gap-4 mb-6">
                    {["plans", "coupons", "promos"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{tab}</button>
                    ))}
                </div>
                {activeTab === "plans" && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <DataTable 
                            columns={[{key: 'name', label: 'Plan Name'}, {key: 'monthly_price', label: 'Monthly Price'}, {key: 'currency', label: 'Currency'}, {key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive'}]}
                            data={plans}
                            emptyMessage="No subscription plans created yet. Click 'Create Plan' to start."
                        />
                    </div>
                )}
                {activeTab !== "plans" && <EmptyState title="Coming Soon" message="Coupon and Promo management is being finalized." />}
            </PageContainer>
        );
    }

    // --- VIEW 2: PROPRIETOR (Renew / Upgrade) ---
    return (
        <PageContainer>
            <PageHeader title="Subscription" subtitle="Manage your school's platform access." />
            {mySub && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Current Plan: {mySub.plan?.name}</h3>
                            <p className="text-slate-500">Status: <span className={`font-semibold ${mySub.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{mySub.status?.toUpperCase()}</span></p>
                            <p className="text-slate-500 text-sm mt-1">Expires on: {new Date(mySub.expiry_date).toLocaleDateString()}</p>
                        </div>
                        {mySub.status !== 'exempt' && (
                            <button onClick={handleRenew} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Renew Now</button>
                        )}
                    </div>
                </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length === 0 ? <div className="col-span-full"><EmptyState title="No Plans Available" message="The platform owner has not published any subscription plans yet." /></div> : plans.map(plan => (
                    <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                        <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                        <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                        <div className="text-2xl font-bold text-indigo-600 mb-6">{plan.currency} {plan.monthly_price}<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                        <button disabled className="w-100 py-2 rounded-lg border border-slate-200 text-slate-400 font-medium">
                            {mySub?.plan?.id === plan.id ? 'Current Plan' : 'Request Upgrade'}
                        </button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
