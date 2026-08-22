import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PlatformEmailCenter from "./PlatformEmailCenter";

const modeMeta = {
  payments: { title: "Payments & Invoices", subtitle: "Platform revenue and payment transaction monitoring." },
  currency: { title: "Countries / Currency", subtitle: "Manage the currencies available to platform plans." },
  email: { title: "Email & SMS Settings", subtitle: "Control platform notification preferences." },
  logs: { title: "Backups & Logs", subtitle: "Review platform activity and operational records." },
  health: { title: "System Health", subtitle: "Inspect application, database, storage, cache, queue, and migration health." },
};

const safeArray = (value) => (Array.isArray(value) ? value : []);
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));
const label = (key) => String(key).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const platformLogsFrom = (response) => {
  const payload = response?.data || {};
  const collection = payload.platform_activity || payload.data || [];
  return safeArray(collection?.data || collection);
};

export default function PlatformOperations({ mode = "health" }) {
  const meta = modeMeta[mode] || modeMeta.health;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingCurrencyId, setEditingCurrencyId] = useState(null);
  const [currencyForm, setCurrencyForm] = useState({ name: "", code: "", symbol: "", exchange_rate: "1", is_base: false, is_active: true });

  async function load() {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      if (mode === "health") {
        setData((await api.get("/platform/system-health"))?.data?.data || {});
      } else if (mode === "payments") {
        const response = await api.get("/admin/revenue-dashboard");
        setData(response?.data || {});
      } else if (mode === "currency") {
        const [countriesResponse, currenciesResponse] = await Promise.all([api.get("/countries"), api.get("/currencies")]);
        const countries = countriesResponse?.data?.data || countriesResponse?.data || [];
        const currencies = currenciesResponse?.data?.data || currenciesResponse?.data || [];
        setData({ countries: safeArray(countries), currencies: safeArray(currencies) });
      } else if (mode === "logs") {
        const response = await api.get("/activity-logs", { params: { scope: "platform", per_page: 50 } });
        setData({ logs: platformLogsFrom(response) });
      } else if (mode === "email") {
        const response = await api.get("/system-settings");
        setData(response?.data?.data || response?.data || {});
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || `Unable to load ${meta.title.toLowerCase()}.`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [mode]);

  async function updateNotifications(event) {
    event.preventDefault();
    try {
      setSaving(true); setMessage(""); setError("");
      await api.put("/system-settings", { email_notifications: Boolean(data?.email_notifications), sms_notifications: Boolean(data?.sms_notifications) });
      setMessage("Notification settings saved successfully.");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to save notification settings.");
    } finally { setSaving(false); }
  }

  function beginCurrencyEdit(currency) {
    setEditingCurrencyId(currency.id);
    setCurrencyForm({ name: currency.name || "", code: currency.code || "", symbol: currency.symbol || "", exchange_rate: currency.exchange_rate ?? "1", is_base: Boolean(currency.is_base), is_active: currency.is_active !== false });
  }

  function resetCurrencyForm() {
    setEditingCurrencyId(null);
    setCurrencyForm({ name: "", code: "", symbol: "", exchange_rate: "1", is_base: false, is_active: true });
  }

  async function saveCurrency(event) {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      const payload = { ...currencyForm, exchange_rate: Number(currencyForm.exchange_rate), is_base: Boolean(currencyForm.is_base), is_active: Boolean(currencyForm.is_active) };
      if (editingCurrencyId) await api.put(`/currencies/${editingCurrencyId}`, payload);
      else await api.post("/currencies", payload);
      setMessage(editingCurrencyId ? "Currency updated successfully." : "Currency created successfully.");
      resetCurrencyForm();
      await load();
    } catch (requestError) {
      const validation = requestError?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : requestError?.response?.data?.message || "Currency could not be saved.");
    } finally { setSaving(false); }
  }

  async function deleteCurrency(currency) {
    if (!window.confirm(`Delete ${currency.name}?`)) return;
    try { await api.delete(`/currencies/${currency.id}`); setMessage("Currency deleted successfully."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Currency could not be deleted."); }
  }

  const healthItems = Object.entries(data || {});
  const statistics = data?.statistics || {};
  const recentPayments = safeArray(data?.recent_payments);
  const billingRevenue = safeArray(data?.billing_cycle_revenue);
  const countries = safeArray(data?.countries);
  const currencies = safeArray(data?.currencies);
  const logs = safeArray(data?.logs);

  return <PageContainer>
    <PageHeader title={meta.title} subtitle={meta.subtitle} />
    {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}
    {message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    {loading ? <LoadingSpinner text={`Loading ${meta.title.toLowerCase()}...`} /> : mode === "health" ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{healthItems.map(([key, value]) => { const detail = value && typeof value === "object" ? value : { status: value }; const status = String(detail.status ?? detail.value ?? "unknown"); return <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{label(key)}</p><span className={`rounded-full px-2 py-1 text-xs font-bold ${["up", "writable", "configured", "true"].includes(status) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{status}</span></div>{detail.driver && <p className="mt-3 text-xs text-slate-500">Driver: <span className="font-semibold text-slate-700">{detail.driver}</span></p>}{key === "checked_at" && <p className="mt-2 text-xs text-slate-500">{new Date(status).toLocaleString()}</p>}</div>; })}</div> : mode === "payments" ? <div className="space-y-6"><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Total revenue", statistics.total_revenue], ["This month", statistics.monthly_revenue], ["This year", statistics.yearly_revenue], ["Schools", statistics.total_schools], ["Active subscriptions", statistics.active_subscriptions]].map(([title, value]) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-500">{title}</p><p className="mt-2 text-xl font-bold text-slate-900">{title === "Schools" || title === "Active subscriptions" ? Number(value || 0).toLocaleString() : money(value)}</p></div>)}</div><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold text-slate-900">Revenue by billing cycle</h2>{billingRevenue.length === 0 ? <EmptyState title="No billing revenue yet" message="Successful subscription payments will appear here." /> : <div className="mt-3 grid gap-3 sm:grid-cols-3">{billingRevenue.map((item) => <div key={item.billing_cycle || item.total} className="rounded-lg bg-slate-50 p-3"><p className="text-sm capitalize text-slate-500">{item.billing_cycle || "Other"}</p><p className="mt-1 font-bold">{money(item.total)}</p></div>)}</div>}</section><section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="font-bold text-slate-900">Recent successful payments</h2></div>{recentPayments.length === 0 ? <EmptyState title="No successful payments" message="Verified platform subscription payments will appear here." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">School</th><th className="p-4">Plan</th><th className="p-4">Cycle</th><th className="p-4 text-right">Amount</th><th className="p-4">Paid</th></tr></thead><tbody className="divide-y">{recentPayments.map((payment) => <tr key={payment.id}><td className="p-4 font-medium">{payment.school?.name || "—"}</td><td className="p-4">{payment.school_subscription?.subscription_plan?.name || payment.schoolSubscription?.subscriptionPlan?.name || "—"}</td><td className="p-4">{payment.billing_cycle || "—"}</td><td className="p-4 text-right font-semibold text-emerald-700">{money(payment.amount)}</td><td className="p-4">{payment.paid_at ? new Date(payment.paid_at).toLocaleString() : "—"}</td></tr>)}</tbody></table>}</section></div> : mode === "currency" ? <div className="space-y-6"><form onSubmit={saveCurrency} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">{editingCurrencyId ? "Edit currency" : "Add currency"}</h2><p className="text-xs text-slate-500">Use the platform currency contract: name, code, symbol, exchange rate, base, and active state.</p></div>{editingCurrencyId && <button type="button" onClick={resetCurrencyForm} className="text-sm font-semibold text-slate-500 underline">Cancel edit</button>}</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"><input required placeholder="Name" value={currencyForm.name} onChange={(event) => setCurrencyForm({ ...currencyForm, name: event.target.value })} className="rounded-lg border px-3 py-2" /><input required maxLength={3} placeholder="Code e.g. NGN" value={currencyForm.code} onChange={(event) => setCurrencyForm({ ...currencyForm, code: event.target.value.toUpperCase() })} className="rounded-lg border px-3 py-2" /><input required placeholder="Symbol" value={currencyForm.symbol} onChange={(event) => setCurrencyForm({ ...currencyForm, symbol: event.target.value })} className="rounded-lg border px-3 py-2" /><input required type="number" min="0" step="0.000001" placeholder="Exchange rate" value={currencyForm.exchange_rate} onChange={(event) => setCurrencyForm({ ...currencyForm, exchange_rate: event.target.value })} className="rounded-lg border px-3 py-2" /><label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={currencyForm.is_base} onChange={(event) => setCurrencyForm({ ...currencyForm, is_base: event.target.checked })} /> Base currency</label><label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={currencyForm.is_active} onChange={(event) => setCurrencyForm({ ...currencyForm, is_active: event.target.checked })} /> Active</label></div><button type="submit" disabled={saving} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingCurrencyId ? "Update currency" : "Create currency"}</button></form><div className="grid gap-6 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold">Countries</h2>{countries.length === 0 ? <EmptyState title="No countries" message="No country records are available." /> : <ul className="mt-3 divide-y">{countries.map((country) => <li key={country.id || country.code} className="py-2 text-sm">{country.name} {country.code ? `(${country.code})` : ""}</li>)}</ul>}</section><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold">Currencies</h2>{currencies.length === 0 ? <EmptyState title="No currencies" message="Create the first platform currency above." /> : <div className="mt-3 divide-y">{currencies.map((currency) => <div key={currency.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{currency.name} ({currency.code})</p><p className="text-xs text-slate-500">{currency.symbol} · Rate {currency.exchange_rate} · {currency.is_active ? "Active" : "Inactive"}</p></div><div className="flex gap-3"><button type="button" onClick={() => beginCurrencyEdit(currency)} className="font-semibold text-indigo-700">Edit</button><button type="button" onClick={() => deleteCurrency(currency)} className="font-semibold text-red-600">Delete</button></div></div>)}</div>}</section></div></div> : mode === "email" ? <PlatformEmailCenter /> : mode === "logs" ? <div className="space-y-3">{logs.length ? logs.map((log) => <article key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold text-slate-900">{log.description || log.action || "Platform activity"}</p><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{log.module || "Platform"}</span></div><p className="mt-2 text-xs text-slate-500">{log.user?.name || "System"} · {log.created_at ? new Date(log.created_at).toLocaleString() : ""}</p></article>) : <EmptyState title="No platform logs" message="Platform activity will appear here after Software Owner actions are recorded." />}</div> : null}
  </PageContainer>;
}
