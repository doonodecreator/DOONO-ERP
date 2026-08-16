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
    
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '',
        monthly_price: '', quarterly_price: '', half_yearly_price: '', yearly_price: '',
        currency: 'NGN', max_students: 500, max_staff: 50, max_branches: 1,
        trial_days: 30, is_active: true
    });

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

    const handleNameChange = (name) => {
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        setFormData({ ...formData, name, slug });
    };

    async function handleSavePlan(e) {
        e.preventDefault();
        setError("");
        setMessage("");
        try {
            setLoading(true);
            await api.post("/subscription-plans", formData);
            setMessage("Plan created successfully!");
            setShowForm(false);
            setFormData({
                name: '', slug: '', description: '',
                monthly_price: '', quarterly_price: '', half_yearly_price: '', yearly_price: '',
                currency: 'NGN', max_students: 500, max_staff: 50, max_branches: 1,
                trial_days: 30, is_active: true
            });
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save plan. Please check all fields.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    if (loading && plans.length === 0) return <PageContainer><LoadingSpinner /></PageContainer>;

    if (isPlatformAdmin) {
        return (
            <PageContainer>
                <PageHeader 
                    title="Subscription Plans" 
                    subtitle="Platform Master Control Panel" 
                    action={
                        <button 
                            onClick={() => setShowForm(!showForm)} 
                            style={{ backgroundColor: showForm ? '#ef4444' : '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', border: 'none' }}
                        >
                            {showForm ? 'Cancel' : '+ Create Plan'}
                        </button>
                    }
                />

                {message && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #d1fae5' }}>{message}</div>}
                {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fee2e2' }}>{error}</div>}

                {showForm && (
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>New Subscription Plan</h3>
                        <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Plan Name</label>
                                <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="e.g. Basic Plan" value={formData.name} onChange={e => handleNameChange(e.target.value)} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Monthly Price</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.monthly_price} onChange={e => setFormData({...formData, monthly_price: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Yearly Price</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.yearly_price} onChange={e => setFormData({...formData, yearly_price: e.target.value})} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Quarterly Price</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.quarterly_price} onChange={e => setFormData({...formData, quarterly_price: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Half-Yearly Price</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.half_yearly_price} onChange={e => setFormData({...formData, half_yearly_price: e.target.value})} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Max Students</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.max_students} onChange={e => setFormData({...formData, max_students: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Trial Days</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.trial_days} onChange={e => setFormData({...formData, trial_days: e.target.value})} required />
                                </div>
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', fontSize: '1rem', border: 'none', marginTop: '10px', cursor: 'pointer' }}>
                                {loading ? 'Saving...' : 'Create Subscription Plan'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {["plans", "coupons", "promos"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: '600', textTransform: 'capitalize', border: '1px solid #e2e8f0', backgroundColor: activeTab === tab ? '#4f46e5' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</button>
                    ))}
                </div>

                {activeTab === "plans" && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <DataTable 
                            columns={[
                                {key: 'name', label: 'Plan'}, 
                                {key: 'monthly_price', label: 'Monthly', render: (row) => `${row.currency} ${row.monthly_price}`}, 
                                {key: 'yearly_price', label: 'Yearly', render: (row) => `${row.currency} ${row.yearly_price}`},
                                {key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive'}
                            ]}
                            data={plans}
                            emptyMessage="No plans found. Create one above."
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
