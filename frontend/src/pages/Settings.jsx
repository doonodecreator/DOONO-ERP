import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [settings, setSettings] = useState({
        platform_name: "", platform_email: "", platform_phone: "", platform_logo: "",
        trial_days: 30, default_subscription_plan_id: "", default_currency_id: "",
        allow_school_registration: true, maintenance_mode: false,
        enforce_subscriptions: false, paystack_enabled: true, stripe_enabled: false,
        email_notifications: true, sms_notifications: false
    });

    const [plans, setPlans] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [settingsRes, plansRes, currenciesRes] = await Promise.all([
                api.get("/system-settings"),
                api.get("/subscription-plans"),
                api.get("/currencies")
            ]);
            
            const sData = settingsRes.data?.data || settingsRes.data || {};
            setSettings({
                ...settings,
                ...sData,
                default_subscription_plan_id: sData.default_subscription_plan_id?.toString() || "",
                default_currency_id: sData.default_currency_id?.toString() || ""
            });
            
            const pItems = plansRes.data?.data?.data || plansRes.data?.data || plansRes.data || [];
            setPlans(Array.isArray(pItems) ? pItems : []);
            
            const cItems = currenciesRes.data?.data || currenciesRes.data || [];
            setCurrencies(Array.isArray(cItems) ? cItems : []);
        } catch (err) {
            setError("Failed to load settings. Check your connection.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            setMessage("");
            setError("");
            await api.put("/system-settings", settings);
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader 
                title="System Settings" 
                subtitle="Global SaaS Platform Control" 
                action={<button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>}
            />

            {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 mb-6 font-medium">{message}</div>}
            {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 mb-6 font-medium">{error}</div>}

            <div className="space-y-8">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> General Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Platform Name</label>
                            <input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_name || ""} onChange={e => setSettings({...settings, platform_name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Support Email</label>
                            <input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_email || ""} onChange={e => setSettings({...settings, platform_email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Support Phone</label>
                            <input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_phone || ""} onChange={e => setSettings({...settings, platform_phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Trial Period (Days)</label>
                            <input type="number" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.trial_days || 0} onChange={e => setSettings({...settings, trial_days: e.target.value})} />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-amber-500 rounded-full"></span> Billing & Subscriptions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Default Plan</label>
                            <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.default_subscription_plan_id || ""} onChange={e => setSettings({...settings, default_subscription_plan_id: e.target.value})}>
                                <option value="">Select Plan</option>
                                {plans.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">System Currency</label>
                            <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.default_currency_id || ""} onChange={e => setSettings({...settings, default_currency_id: e.target.value})}>
                                <option value="">Select Currency</option>
                                {currencies.map(c => <option key={c.id} value={c.id.toString()}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-900">Enforce Subscriptions</h4>
                                <p className="text-xs text-slate-500">Require schools to pay to access features</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!settings.enforce_subscriptions} onChange={e => setSettings({...settings, enforce_subscriptions: e.target.checked})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-900">Enable Paystack</h4>
                                <p className="text-xs text-slate-500">Allow payments via Paystack gateway</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!settings.paystack_enabled} onChange={e => setSettings({...settings, paystack_enabled: e.target.checked})} />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> System & Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-900">Self Registration</h4>
                                <p className="text-xs text-slate-500">Allow new schools to register themselves</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!settings.allow_school_registration} onChange={e => setSettings({...settings, allow_school_registration: e.target.checked})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-900">Maintenance Mode</h4>
                                <p className="text-xs text-slate-500">Take the platform offline for updates</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-900">Email Notifications</h4>
                                <p className="text-xs text-slate-500">Send system alerts via email</p>
                            </div>
                            <input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!settings.email_notifications} onChange={e => setSettings({...settings, email_notifications: e.target.checked})} />
                        </div>
                    </div>
                </section>
            </div>
        </PageContainer>
    );
}
