import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function Settings() {
    const { isPlatformAdmin, school } = useAuth();
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

    const [schoolData, setSchoolData] = useState({
        name: "", short_name: "", email: "", phone: "", address: "", school_type: "Combined",
        motto: "", bank_name: "", account_number: "", account_name: "",
        paystack_public_key: "", paystack_secret_key: "", paystack_subaccount_code: ""
    });

    const [plans, setPlans] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => { loadData(); }, [isPlatformAdmin, school]);

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            if (isPlatformAdmin) {
                const [sRes, pRes, cRes] = await Promise.all([api.get("/system-settings"), api.get("/subscription-plans"), api.get("/currencies")]);
                const sData = sRes.data?.data || sRes.data || {};
                setSettings(prev => ({ ...prev, ...sData, default_subscription_plan_id: sData.default_subscription_plan?.id || sData.default_subscription_plan_id || "", default_currency_id: sData.default_currency?.id || sData.default_currency_id || "" }));
                setPlans(pRes.data?.data?.data || pRes.data?.data || pRes.data || []);
                setCurrencies(cRes.data?.data || cRes.data || []);
            } else if (school) {
                const [profileRes, settingsRes] = await Promise.all([api.get(`/schools/${school.id}`), api.get("/school-settings")]);
                const sInfo = profileRes.data?.data || profileRes.data || school;
                const opsData = settingsRes.data?.data || {};
                setSchoolData({ name: sInfo.name || "", short_name: sInfo.short_name || "", email: sInfo.email || "", phone: sInfo.phone || "", address: sInfo.address || "", school_type: sInfo.school_type || "Combined", motto: opsData.motto || "", bank_name: opsData.bank_name || "", account_number: opsData.account_number || "", account_name: opsData.account_name || "", paystack_public_key: opsData.paystack_public_key || "", paystack_secret_key: opsData.paystack_secret_key || "", paystack_subaccount_code: opsData.paystack_subaccount_code || "" });
            }
        } catch (err) { setError("Failed to load some settings. Please try again."); } finally { setLoading(false); }
    }

    async function handleSave() {
        try {
            setSaving(true); setMessage(""); setError("");
            if (isPlatformAdmin) await api.put("/system-settings", settings);
            else if (school) {
                await Promise.all([
                    api.put(`/schools/${school.id}`, { name: schoolData.name, short_name: schoolData.short_name, email: schoolData.email, phone: schoolData.phone, address: schoolData.address, school_type: schoolData.school_type }),
                    api.put("/school-settings", { motto: schoolData.motto, bank_name: schoolData.bank_name, account_number: schoolData.account_number, account_name: schoolData.account_name, paystack_public_key: schoolData.paystack_public_key, paystack_secret_key: schoolData.paystack_secret_key, paystack_subaccount_code: schoolData.paystack_subaccount_code })
                ]);
            }
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) { setError(err.response?.data?.message || "Failed to save settings."); } finally { setSaving(false); }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    if (!isPlatformAdmin) {
        return (
            <PageContainer>
                <PageHeader title="School Settings" subtitle="Manage school profile and operations" action={<button onClick={handleSave} disabled={saving} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-amber-700 disabled:opacity-50">{saving ? "Saving..." : "Save School Settings"}</button>} />
                {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 mb-6 font-medium">{message}</div>}
                {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 mb-6 font-medium">{error}</div>}
                <div className="space-y-8">
                    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-4 mb-6">School Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">School Name</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.name} onChange={e => setSchoolData({...schoolData, name: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Short Name</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.short_name} onChange={e => setSchoolData({...schoolData, short_name: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Motto</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.motto} onChange={e => setSchoolData({...schoolData, motto: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">School Type</label><select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.school_type} onChange={e => setSchoolData({...schoolData, school_type: e.target.value})}><option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="Combined">Combined</option></select></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Email</label><input type="email" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.email} onChange={e => setSchoolData({...schoolData, email: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Phone</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.phone} onChange={e => setSchoolData({...schoolData, phone: e.target.value})} /></div>
                            <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-slate-600">Address</label><textarea className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" rows={2} value={schoolData.address} onChange={e => setSchoolData({...schoolData, address: e.target.value})} /></div>
                        </div>
                    </section>
                    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-4 mb-6">Financial & Payment Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Bank Name</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.bank_name} onChange={e => setSchoolData({...schoolData, bank_name: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Account Number</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.account_number} onChange={e => setSchoolData({...schoolData, account_number: e.target.value})} /></div>
                            <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-slate-600">Account Name</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.account_name} onChange={e => setSchoolData({...schoolData, account_name: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Paystack Public Key</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.paystack_public_key} onChange={e => setSchoolData({...schoolData, paystack_public_key: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Paystack Subaccount Code</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" value={schoolData.paystack_subaccount_code} onChange={e => setSchoolData({...schoolData, paystack_subaccount_code: e.target.value})} placeholder="ACCT_xxxxxxxxx" /></div>
                        </div>
                    </section>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader title="System Settings" subtitle="Global SaaS Control" action={<button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>} />
            {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 mb-6 font-medium">{message}</div>}
            {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 mb-6 font-medium">{error}</div>}
            <div className="space-y-8">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-indigo-600 rounded-full"></span> General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Platform Name</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_name || ""} onChange={e => setSettings({...settings, platform_name: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Support Email</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_email || ""} onChange={e => setSettings({...settings, platform_email: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Support Phone</label><input className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.platform_phone || ""} onChange={e => setSettings({...settings, platform_phone: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Trial Period (Days)</label><input type="number" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.trial_days || 0} onChange={e => setSettings({...settings, trial_days: e.target.value})} /></div>
                    </div>
                </section>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-amber-500 rounded-full"></span> Billing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Default Plan</label><select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.default_subscription_plan_id || ""} onChange={e => setSettings({...settings, default_subscription_plan_id: e.target.value})}><option value="">Select Plan</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-sm font-semibold text-slate-600">Currency</label><select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.default_currency_id || ""} onChange={e => setSettings({...settings, default_currency_id: e.target.value})}><option value="">Select Currency</option>{currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"><div><h4 className="font-bold text-slate-900">Enforce Subscriptions</h4><p className="text-xs text-slate-500">Require payment for features</p></div><input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600" checked={!!settings.enforce_subscriptions} onChange={e => setSettings({...settings, enforce_subscriptions: e.target.checked})} /></div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"><div><h4 className="font-bold text-slate-900">Paystack</h4><p className="text-xs text-slate-500">Enable Paystack gateway</p></div><input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600" checked={!!settings.paystack_enabled} onChange={e => setSettings({...settings, paystack_enabled: e.target.checked})} /></div>
                    </div>
                </section>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-emerald-500 rounded-full"></span> System</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"><div><h4 className="font-bold text-slate-900">Self Registration</h4><p className="text-xs text-slate-500">Allow schools to register</p></div><input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600" checked={!!settings.allow_school_registration} onChange={e => setSettings({...settings, allow_school_registration: e.target.checked})} /></div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"><div><h4 className="font-bold text-slate-900">Maintenance Mode</h4><p className="text-xs text-slate-500">Take platform offline</p></div><input type="checkbox" className="w-6 h-6 rounded border-slate-300 text-indigo-600" checked={!!settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} /></div>
                    </div>
                </section>
            </div>
        </PageContainer>
    );
}
