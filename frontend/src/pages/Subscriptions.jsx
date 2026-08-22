import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import DataTable from "../components/tables/DataTable";

export default function Subscriptions() {
    const { isPlatformAdmin, roles, isOrganizationOwner, school } = useAuth();
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [payingPlanId, setPayingPlanId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("plans");
    const [data, setData] = useState([]);
    const [featureOptions, setFeatureOptions] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [access, setAccess] = useState({ platform_free_access: false, school_free_access: false, enforced: false, free_features: [], plan_features: [], available_features: [], locked_features: [], feature_catalog: [] });
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
            if (activeTab === "features") endpoint = "/features";
            if (activeTab === "coupons") endpoint = "/coupons";
            if (activeTab === "promos") endpoint = "/promo-campaigns";

            const res = await api.get(endpoint);
            const items = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
            setData(Array.isArray(items) ? items : []);

            if (isPlatformAdmin && activeTab === "plans") {
                const featureRes = await api.get("/features", { params: { active_only: true, per_page: 100 } });
                const featureItems = featureRes.data?.data?.data ?? featureRes.data?.data ?? featureRes.data ?? [];
                setFeatureOptions(Array.isArray(featureItems) ? featureItems : []);
            }

            if (!isPlatformAdmin && activeTab === "plans") {
                try {
                    const subRes = await api.get("/my-subscription");
                    const subscription = subRes.data?.data ?? subRes.data ?? null;
                    setMySub(subscription && typeof subscription === "object" ? subscription : null);
                    setAccess(subRes.data?.access && typeof subRes.data.access === "object" ? subRes.data.access : { platform_free_access: false, school_free_access: false, enforced: true, free_features: [], plan_features: [], available_features: [], locked_features: [], feature_catalog: [] });
                } catch (subscriptionError) {
                    if (subscriptionError.response?.status === 404) {
                        setMySub(null);
                        setAccess({ platform_free_access: false, school_free_access: false, enforced: true, free_features: [], plan_features: [], available_features: [], locked_features: [], feature_catalog: [] });
                    } else {
                        throw subscriptionError;
                    }
                }
            }
        } catch (err) {
            setData([]);
            setError(err.response?.data?.message || `Failed to load ${activeTab}. Please try again.`);
        } finally {
            setLoading(false);
        }
    }

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        if (activeTab === "plans") {
            setFormData({ name: '', slug: '', description: '', monthly_price: '', quarterly_price: '', half_yearly_price: '', yearly_price: '', currency: 'NGN', max_students: 500, max_staff: 50, max_branches: 1, trial_days: 30, feature_ids: [], is_active: true });
        } else if (activeTab === "features") {
            setFormData({ name: '', slug: '', description: '', category: '', is_active: true });
        } else if (activeTab === "coupons") {
            setFormData({ name: '', code: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', maximum_usage: 100, first_time_only: false, is_active: true });
        } else {
            setFormData({ name: '', slug: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', auto_activate: true, is_active: true });
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
            if (activeTab === "features") endpoint = "/features";
            if (activeTab === "coupons") endpoint = "/coupons";
            if (activeTab === "promos") endpoint = "/promo-campaigns";

            const payload = { ...formData };
            if (activeTab === "plans") {
                for (const field of ["max_students", "max_staff", "max_branches", "trial_days"]) {
                    if (payload[field] === "" || payload[field] === null || payload[field] === undefined) {
                        payload[field] = field === "max_branches" ? 1 : field === "trial_days" ? 0 : null;
                    } else {
                        payload[field] = Number(payload[field]);
                    }
                }
            }
            if (!editingId) {
                if ((activeTab === "plans" || activeTab === "promos" || activeTab === "features") && !payload.slug) {
                    payload.slug = payload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                }
            }

            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, payload);
                setMessage("Updated successfully!");
            } else {
                await api.post(endpoint, payload);
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

    const cycleLabels = {
        monthly: "Monthly",
        quarterly: "Quarterly",
        half_yearly: "Half-yearly",
        yearly: "Yearly",
    };

    const priceForCycle = (plan) => plan?.[`${billingCycle}_price`] ?? 0;
    const isCurrentActivePlan = (plan) => mySub?.plan?.id === plan?.id && ["active", "trial"].includes(mySub?.status) && Number(mySub?.days_remaining || 0) > 0;
    const hasFreeAccess = Boolean(access.platform_free_access || access.school_free_access || mySub?.is_exempt || mySub?.is_free_access);
    const paymentBlockedBySchoolGrant = Boolean(access.platform_free_access || mySub?.is_exempt || (mySub?.is_free_access && !access.platform_free_access));
    const featureCatalog = Array.isArray(access.feature_catalog) ? access.feature_catalog : [];
    const availableFeatures = Array.isArray(access.available_features) ? access.available_features : [];
    const freeFeatures = Array.isArray(access.free_features) ? access.free_features : [];
    const planFeatures = (plan) => {
        if (Array.isArray(plan?.feature_models)) {
            return plan.feature_models.map((feature) => feature?.name || feature?.slug).filter(Boolean);
        }
        if (Array.isArray(plan?.features)) {
            return plan.features.map((feature) => feature === '*' ? 'All platform modules' : feature).filter(Boolean);
        }
        return [];
    };

    async function handleUpgrade(plan) {
        if (!plan?.id || paymentBlockedBySchoolGrant) return;
        setError("");
        setMessage("");
        setPayingPlanId(plan.id);
        try {
            const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `subscription-${plan.id}-${billingCycle}-${Date.now()}`;
            const response = await api.post("/payments/initialize-subscription", {
                subscription_plan_id: plan.id,
                billing_cycle: billingCycle,
            }, {
                headers: { "Idempotency-Key": idempotencyKey },
            });
            const authorizationUrl = response?.data?.data?.authorization_url;
            if (!authorizationUrl) throw new Error("Paystack did not return a checkout URL.");
            window.location.assign(authorizationUrl);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to start subscription payment.");
            setPayingPlanId(null);
        }
    }

    function startEditing(row) {
        setEditingId(row.id);
        if (activeTab === "plans") {
            setFormData({
                ...row,
                max_students: row.max_students ?? null,
                max_staff: row.max_staff ?? null,
                max_branches: row.max_branches ?? 1,
                trial_days: row.trial_days ?? 0,
                feature_ids: Array.isArray(row.feature_ids) ? row.feature_ids : [],
            });
        } else {
            setFormData(row);
        }
        setShowForm(true);
    }

    async function handleDelete(id) {
        if (!window.confirm("Are you sure?")) return;
        try {
            let endpoint = "/subscription-plans";
            if (activeTab === "features") endpoint = "/features";
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
                        <button type="button" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: showForm ? '#ef4444' : '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', border: 'none' }}>
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
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.currency || 'NGN'} onChange={e => setFormData({...formData, currency: e.target.value})} required>
                                        <option value="NGN">NGN — Nigerian Naira</option>
                                        <option value="GHS">GHS — Ghanaian Cedi</option>
                                        <option value="KES">KES — Kenyan Shilling</option>
                                        <option value="ZAR">ZAR — South African Rand</option>
                                        <option value="USD">USD — US Dollar</option>
                                    </select>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Monthly Price" value={formData.monthly_price || ''} onChange={e => setFormData({...formData, monthly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Yearly Price" value={formData.yearly_price || ''} onChange={e => setFormData({...formData, yearly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Quarterly Price" value={formData.quarterly_price || ''} onChange={e => setFormData({...formData, quarterly_price: e.target.value})} required />
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Half-Yearly Price" value={formData.half_yearly_price || ''} onChange={e => setFormData({...formData, half_yearly_price: e.target.value})} required />
                                    <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Max Students (use -1 for unlimited)
                                        <input type="number" min="-1" step="1" style={{ display: 'block', width: '100%', marginTop: '6px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Max Students" value={formData.max_students ?? ''} onChange={e => setFormData({...formData, max_students: e.target.value})} />
                                    </label>
                                    <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Max Staff (use -1 for unlimited)
                                        <input type="number" min="-1" step="1" style={{ display: 'block', width: '100%', marginTop: '6px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Max Staff" value={formData.max_staff ?? ''} onChange={e => setFormData({...formData, max_staff: e.target.value})} />
                                    </label>
                                    <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Max Branches (use -1 for unlimited)
                                        <input type="number" min="-1" step="1" style={{ display: 'block', width: '100%', marginTop: '6px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Max Branches" value={formData.max_branches ?? ''} onChange={e => setFormData({...formData, max_branches: e.target.value})} required />
                                    </label>
                                    <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Trial Days
                                        <input type="number" min="0" step="1" style={{ display: 'block', width: '100%', marginTop: '6px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Trial Days" value={formData.trial_days ?? ''} onChange={e => setFormData({...formData, trial_days: e.target.value})} required />
                                    </label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                    <label style={{ gridColumn: '1 / -1', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                                        Enabled Features
                                        <select multiple value={Array.isArray(formData.feature_ids) ? formData.feature_ids.map(String) : []} onChange={e => setFormData({...formData, feature_ids: Array.from(e.target.selectedOptions, option => Number(option.value))})} style={{ display: 'block', width: '100%', minHeight: '120px', marginTop: '6px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>
                                            {(Array.isArray(featureOptions) ? featureOptions : []).map(feature => <option key={feature.id} value={feature.id}>{feature.name}{feature.category ? ` — ${feature.category}` : ''}</option>)}
                                        </select>
                                        <span style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem', fontWeight: 400 }}>Hold Ctrl or use multi-select gestures to choose the features included in this plan.</span>
                                    </label>
                                </div>
                            )}

                            {activeTab === "features" && (
                                <>
                                    <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Slug, e.g. report-cards" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} required />
                                    <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Category, e.g. Academics" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                                    <textarea style={{ width: '100%', minHeight: '90px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="Describe what this feature enables" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={String(formData.is_active)} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </>
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
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.first_time_only} onChange={e => setFormData({...formData, first_time_only: e.target.value === 'true'})}>
                                        <option value="false">All Users</option>
                                        <option value="true">First Time Only</option>
                                    </select>
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
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={formData.auto_activate} onChange={e => setFormData({...formData, auto_activate: e.target.value === 'true'})}>
                                        <option value="true">Auto Activate</option>
                                        <option value="false">Manual Only</option>
                                    </select>
                                </>
                            )}

                            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                {editingId ? 'Update' : 'Create'} {activeTab.slice(0, -1)}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {['plans', 'features', 'coupons', 'promos'].map(tab => (
                        <button type="button" key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: '600', textTransform: 'capitalize', border: '1px solid #e2e8f0', backgroundColor: activeTab === tab ? '#4f46e5' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</button>
                    ))}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <DataTable
                        columns={[
                            {key: 'name', label: 'Name'},
                            activeTab === 'plans' ? {key: 'monthly_price', label: 'Monthly', render: (row) => `${row.currency} ${row.monthly_price}`} : activeTab === 'features' ? {key: 'category', label: 'Category', render: (row) => row.category || 'General'} : {key: 'discount_value', label: 'Discount', render: (row) => `${row.discount_value}${row.discount_type === 'percentage' ? '%' : ''}`},
                            {key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive'},
                            {key: 'actions', label: 'Actions', render: (row) => (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => startEditing(row)} style={{ color: '#4f46e5', fontWeight: 'bold' }}>Edit</button>
                                    <button type="button" onClick={() => handleDelete(row.id)} style={{ color: '#ef4444', fontWeight: 'bold' }}>Delete</button>
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
            {error && (
                <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span>{error}</span>
                    <button type="button" onClick={loadData} className="ml-4 font-semibold underline">Retry</button>
                </div>
            )}
            {message && <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                {mySub ? (
                    <>
                        <h3 className="text-lg font-bold">Current Plan: {mySub.plan?.name || "Subscription"}</h3>
                        <p className="text-slate-500">Status: <span className="text-green-600 font-bold">{mySub.status?.toUpperCase() || "NOT ACTIVE"}</span></p>
                        <p className="text-sm">Expires: {mySub.expiry_date ? new Date(mySub.expiry_date).toLocaleDateString() : "Not active yet"}</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-slate-900">No active subscription yet</h3>
                        <p className="mt-1 text-sm text-slate-600">Choose a plan below to open secure Paystack checkout. Your school will be activated only after Paystack confirms the payment.</p>
                    </>
                )}
            </div>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="font-semibold text-indigo-900">Choose a billing cycle</p>
                    <p className="text-xs text-indigo-700">Payment opens securely in Paystack. Your plan changes only after payment is verified.</p>
                </div>
                <select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    {Object.entries(cycleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>
            {hasFreeAccess && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    {access.platform_free_access
                        ? "The Software Owner has enabled free access for all schools. No payment is required until subscription enforcement is turned on."
                        : "This school currently has free access. No payment is required during the active exemption or free-access period."}
                </div>
            )}
            {featureCatalog.length > 0 && (
                <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="subscription-access-heading">
                    <div className="mb-4">
                        <h3 id="subscription-access-heading" className="text-lg font-bold text-slate-900">What your school can use</h3>
                        <p className="mt-1 text-sm text-slate-600">Core school operations remain available while you set up your school. A paid plan unlocks the modules listed in its entitlement list.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {featureCatalog.map((feature) => {
                            const slug = feature?.slug;
                            const isFree = slug && freeFeatures.includes(slug);
                            const isAvailable = slug && availableFeatures.includes(slug);
                            return (
                                <div key={slug || feature?.id || feature?.name} className={`rounded-xl border p-3 ${isAvailable ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{feature?.name || "Feature"}</p>
                                            <p className="mt-1 text-xs text-slate-600">{feature?.description || "School module access"}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                            {isFree ? "Free" : isAvailable ? "Included" : "Upgrade"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-lg">{plan.name}</h4>
                        <div className="text-2xl font-bold text-indigo-600 my-4">{plan.currency} {priceForCycle(plan)} <span className="text-sm font-medium text-slate-500">/{cycleLabels[billingCycle].toLowerCase()}</span></div>
                        <div className="mb-4 space-y-1 text-xs text-slate-600">
                            <p><strong>Students:</strong> {Number(plan.max_students) < 0 ? 'Unlimited' : plan.max_students ?? 'Not specified'}</p>
                            <p><strong>Staff:</strong> {Number(plan.max_staff) < 0 ? 'Unlimited' : plan.max_staff ?? 'Not specified'}</p>
                            <p><strong>Branches:</strong> {Number(plan.max_branches) < 0 ? 'Unlimited' : plan.max_branches ?? 'Not specified'}</p>
                        </div>
                        {planFeatures(plan).length > 0 && (
                            <div className="mb-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                                <p className="mb-1 font-semibold text-slate-800">Included features</p>
                                <ul className="list-disc space-y-1 pl-4">
                                    {planFeatures(plan).slice(0, 8).map((feature) => <li key={`${plan.id}-${feature}`}>{feature}</li>)}
                                </ul>
                                {planFeatures(plan).length > 8 && <p className="mt-1 font-semibold text-indigo-600">+ {planFeatures(plan).length - 8} more</p>}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => handleUpgrade(plan)}
                            disabled={payingPlanId === plan.id || isCurrentActivePlan(plan) || paymentBlockedBySchoolGrant}
                            className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                            {payingPlanId === plan.id ? 'Opening Paystack...' : paymentBlockedBySchoolGrant ? 'Free access enabled' : isCurrentActivePlan(plan) ? 'Current Plan' : mySub ? 'Upgrade / Renew' : 'Subscribe now'}
                        </button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
