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
    const [message, setMessage] = useState("");
    
    // Form States
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', monthly_price: '', currency: 'NGN', max_students: 100, max_staff: 10, is_active: true });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [plansRes, subRes] = await Promise.all([
                api.get("/subscription-plans"),
                api.get("/my-subscription")
            ]);
            const planData = plansRes.data?.data?.data ?? plansRes.data?.data ?? plansRes.data ?? [];
            setPlans(Array.isArray(planData) ? planData : []);
            setMySub(subRes.data?.data || subRes.data || null);
        } catch (err) {
            setError("Failed to load subscription details.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSavePlan(e) {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post("/subscription-plans", formData);
            setMessage("Plan created successfully!");
            setShowForm(false);
            setFormData({ name: '', monthly_price: '', currency: 'NGN', max_students: 100, max_staff: 10, is_active: true });
            loadData();
        } catch (err) {
            setError("Failed to save plan.");
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

    if (loading && plans.length === 0) return <PageContainer><LoadingSpinner /></PageContainer>;

    if (isPlatformAdmin) {
        return (
            <PageContainer>
                <PageHeader 
                    title="Subscription Management" 
                    subtitle="Software Owner Master Control Panel" 
                    action={<button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">{showForm ? 'Cancel' : '+ Create New Plan'}</button>}
                />

                {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 border border-emerald-100">{message}</div>}
                {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl mb-6 border border-rose-100">{error}</div>}

                {showForm && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                        <h3 className="font-bold text-lg mb-4">New Subscription Plan</h3>
                        <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="border p-2 rounded-lg" placeholder="Plan Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <input className="border p-2 rounded-lg" type="number" placeholder="Monthly Price" value={formData.monthly_price} onChange={e => setFormData({...formData, monthly_price: e.target.value})} required />
                            <input className="border p-2 rounded-lg" placeholder="Currency (e.g. NGN)" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} required />
                            <input className="border p-2 rounded-lg" type="number" placeholder="Max Students" value={formData.max_students} onChange={e => setFormData({...formData, max_students: e.target.value})} required />
                            <button type="submit" className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg font-bold">Save Plan</button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    {["plans", "coupons", "promos"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', textTransform: 'capitalize', border: '1px solid #e2e8f0', backgroundColor: activeTab === tab ? '#4f46e5' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#475569', cursor: 'pointer' }}>{tab}</button>
                    ))}
                </div>

                {activeTab === "plans" && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <DataTable 
                            columns={[
                                {key: 'name', label: 'Plan Name'}, 
                                {key: 'monthly_price', label: 'Monthly Price', render: (row) => `${row.currency} ${row.monthly_price}`}, 
                                {key: 'max_students', label: 'Students Limit'},
                                {key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive'}
                            ]}
                            data={plans}
                            emptyMessage="No subscription plans found. Use the button above to create one."
                        />
                    </div>
                )}
                {activeTab !== "plans" && <EmptyState title="Coming Soon" message={`${activeTab} management is being implemented.`} />}
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader title="Subscription" subtitle="Manage your school's platform access." />
            {mySub && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Current Plan: {mySub.plan?.name || 'Assigned Plan'}</h3>
                            <p className="text-slate-500">Status: <span className={`font-semibold ${mySub.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{mySub.status?.toUpperCase()}</span></p>
                            <p className="text-slate-500 text-sm mt-1">Expires on: {mySub.expiry_date ? new Date(mySub.expiry_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        {mySub.status !== 'exempt' && (
                            <button onClick={handleRenew} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700">Renew Now</button>
                        )}
                    </div>
                </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length === 0 ? <div className="col-span-full"><EmptyState title="No Plans Available" message="Please contact the platform owner." /></div> : plans.map(plan => (
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
