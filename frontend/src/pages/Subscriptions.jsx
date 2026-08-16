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
    const [data, setData] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => { loadData(); }, [activeTab]);

    async function loadData() {
        try {
            setLoading(true);
            setError("");
            let endpoint = "/subscription-plans";
            if (activeTab === "coupons") endpoint = "/coupons";
            if (activeTab === "promos") endpoint = "/promo-campaigns";

            const res = await api.get(endpoint);
            const items = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
            setData(Array.isArray(items) ? items : []);

            if (!isPlatformAdmin && activeTab === "plans") {
                try {
                    const subRes = await api.get("/my-subscription");
                    setMySub(subRes.data?.data || subRes.data || null);
                } catch (e) { console.log("No school context."); }
            }
        } catch (err) {
            setError(`Failed to load ${activeTab}. Please try again.`);
        } finally {
            setLoading(false);
        }
    }

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        if (activeTab === "plans") {
            setFormData({ name: '', slug: '', description: '', monthly_price: '', quarterly_price: '', half_yearly_price: '', yearly_price: '', currency: 'NGN', max_students: 500, max_staff: 50, max_branches: 1, trial_days: 30, is_active: true });
        } else if (activeTab === "coupons") {
            setFormData({ name: '', code: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', maximum_usage: 100, is_active: true });
        } else {
            setFormData({ name: '', slug: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', is_active: true });
        }
    };

    useEffect(() => { resetForm(); }, [activeTab]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setMessage("");
        try {
            setLoading(true);
            let endpoint = "/subscription-plans";
            if (activeTab === "coupons") endpoint = "/coupons";
            if (activeTab === "promos") endpoint = "/promo-campaigns";

            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, formData);
                setMessage("Updated successfully!");
            } else {
                if (activeTab === "plans" && !formData.slug) {
                    formData.slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                }
                if (activeTab === "promos" && !formData.slug) {
                    formData.slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                }
                await api.post(endpoint, formData);
                setMessage("Created successfully!");
            }
            resetForm();
            loadData();
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.errors) {
                const firstKey = Object.keys(errData.errors)[0];
                setError(errData.errors[firstKey][0]);
            } else {
                setError(errData?.message || "Operation failed. Please check all fields.");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Are you sure?")) return;
        try {
            let endpoint = "/subscription-plans";
            if (activeTab === "coupons") endpoint = "/coupons";
            if (activeTab === "promos") endpoint = "/promo-campaigns";
            await api.delete(`${endpoint}/${id}`);
            loadData();
        } catch (err) { alert("Delete failed."); }
    }

    if (loading && data.length === 0) return <PageContainer><LoadingSpinner /></PageContainer>;

    if (isPlatformAdmin) {
        return (
            <PageContainer>
                <PageHeader 
                    title="Platform Management" 
                    subtitle="Software Owner Control Panel" 
                    action={
                        <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: showForm ? '#ef4444' : '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', border: 'none' }}>
                            {showForm ? 'Cancel' : `+ Create ${activeTab.slice(0, -1)}`}
                        </button>
                    }
                />

                {message && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #d1fae5' }}>{message}</div>}
                {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fee2e2' }}>{error}</div>}

                {showForm && (
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>{editingId ? 'Edit' : 'New'} {activeTab.slice(0, -1)}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            
                            {activeTab === "plans" && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Monthly Price" value={formData.monthly_price || ''} onChange={e => setFormData({...formData, monthly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Yearly Price" value={formData.yearly_price || ''} onChange={e => setFormData({...formData, yearly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Quarterly Price" value={formData.quarterly_price || ''} onChange={e => setFormData({...formData, quarterly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Half-Yearly Price" value={formData.half_yearly_price || ''} onChange={e => setFormData({...formData, half_yearly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Max Students" value={formData.max_students || ''} onChange={e => setFormData({...formData, max_students: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Trial Days" value={formData.trial_days || ''} onChange={e => setFormData({...formData, trial_days: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Max Branches" value={formData.max_branches || 1} onChange={e => setFormData({...formData, max_branches: e.target.value})} required />
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            )}

                            {activeTab === "coupons" && (
                                <>
                                    <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Coupon Code (e.g. SAVE50)" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} required />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.discount_type || 'percentage'} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                        <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Discount Value" value={formData.discount_value || ''} onChange={e => setFormData({...formData, discount_value: e.target.value})} required />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Start Date</label>
                                            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b' }}>End Date</label>
                                            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === "promos" && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.discount_type || 'percentage'} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                        <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Discount Value" value={formData.discount_value || ''} onChange={e => setFormData({...formData, discount_value: e.target.value})} required />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Start Date</label>
                                            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b' }}>End Date</label>
                                            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                {editingId ? 'Update' : 'Create'} {activeTab.slice(0, -1)}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {["plans", "coupons", "promos"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: '600', textTransform: 'capitalize', border: '1px solid #e2e8f0', backgroundColor: activeTab === tab ? '#4f46e5' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</button>
                    ))}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <DataTable 
                        columns={[
                            {key: 'name', label: 'Name'}, 
                            activeTab === 'plans' ? {key: 'monthly_price', label: 'Monthly', render: (row) => `${row.currency} ${row.monthly_price}`} : {key: 'discount_value', label: 'Discount', render: (row) => `${row.discount_value}${row.discount_type === 'percentage' ? '%' : ''}`},
                            {key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive'},
                            {key: 'actions', label: 'Actions', render: (row) => (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => { setEditingId(row.id); setFormData(row); setShowForm(true); }} style={{ color: '#4f46e5', fontWeight: 'bold' }}>Edit</button>
                                    <button onClick={() => handleDelete(row.id)} style={{ color: '#ef4444', fontWeight: 'bold' }}>Delete</button>
                                </div>
                            )}
                        ]}
                        data={data}
                        emptyMessage={`No ${activeTab} found.`}
                    />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader title="Subscription" subtitle="Manage your school's access." />
            {mySub && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-bold">Current Plan: {mySub.plan?.name}</h3>
                    <p className="text-slate-500">Status: <span className="text-green-600 font-bold">{mySub.status?.toUpperCase()}</span></p>
                    <p className="text-sm">Expires: {new Date(mySub.expiry_date).toLocaleDateString()}</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-lg">{plan.name}</h4>
                        <div className="text-2xl font-bold text-indigo-600 my-4">{plan.currency} {plan.monthly_price}/mo</div>
                        <button disabled className="w-full py-2 rounded-lg bg-slate-100 text-slate-400 font-bold">{mySub?.plan?.id === plan.id ? 'Current' : 'Upgrade'}</button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
