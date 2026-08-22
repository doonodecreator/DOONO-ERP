import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
};
const blank = { vehicle_id: "", type: "fuel", amount: "", quantity: "", odometer: "", service_date: new Date().toISOString().slice(0, 10), description: "", status: "completed" };
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default function TransportLogs({ defaultType = "fuel" }) {
  const [type, setType] = useState(defaultType);
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ ...blank, type: defaultType });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [vehicleResponse, logResponse] = await Promise.all([api.get("/vehicles"), api.get("/transport-logs", { params: { type } })]);
      setVehicles(safeArray(vehicleResponse?.data)); setLogs(safeArray(logResponse?.data));
    } catch (requestError) { setError(requestError?.response?.data?.message || requestError?.message || "Transport records could not be loaded."); }
    finally { setLoading(false); }
  };
  useEffect(() => { setForm((current) => ({ ...current, type })); load(); }, [type]);
  const save = async (event) => { event.preventDefault(); setSaving(true); try { await api.post("/transport-logs", { ...form, type, vehicle_id: Number(form.vehicle_id), amount: Number(form.amount), quantity: form.quantity ? Number(form.quantity) : null, odometer: form.odometer ? Number(form.odometer) : null }); setForm({ ...blank, type }); await load(); } catch (requestError) { setError(requestError?.response?.data?.message || "Transport record could not be saved."); } finally { setSaving(false); } };
  const remove = async (log) => { if (!window.confirm("Delete this transport record?")) return; try { await api.delete(`/transport-logs/${log.id}`); await load(); } catch (requestError) { setError(requestError?.response?.data?.message || "Transport record could not be deleted."); } };
  if (loading) return <LoadingSpinner text="Loading transport records..." />;
  return <div className="space-y-6 p-4 md:p-6"><PageHeader title={type === "fuel" ? "Fuel Records" : "Vehicle Maintenance"} description={type === "fuel" ? "Record fuel purchases and odometer readings for school vehicles." : "Record vehicle servicing, repairs, and maintenance costs."} />{error && <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}<div className="flex gap-2"><button type="button" onClick={() => setType("fuel")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === "fuel" ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Fuel Records</button><button type="button" onClick={() => setType("maintenance")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === "maintenance" ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Maintenance</button></div><form onSubmit={save} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><label className="text-sm font-medium text-slate-600">Vehicle<select required value={form.vehicle_id} onChange={(event) => setForm((current) => ({ ...current, vehicle_id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number || vehicle.model || `Vehicle ${vehicle.id}`}</option>)}</select></label><label className="text-sm font-medium text-slate-600">Amount<input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-600">Date<input required type="date" value={form.service_date} onChange={(event) => setForm((current) => ({ ...current, service_date: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>{type === "fuel" && <label className="text-sm font-medium text-slate-600">Quantity<input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>}<label className="text-sm font-medium text-slate-600">Odometer<input type="number" min="0" value={form.odometer} onChange={(event) => setForm((current) => ({ ...current, odometer: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-600 md:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="2" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Record"}</button></div></form><div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{logs.length === 0 ? <EmptyState title={`No ${type} records`} description="Create a record above to begin tracking transport operations." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Vehicle</th><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Odometer</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y">{logs.map((log) => <tr key={log.id}><td className="p-4 font-medium">{log.vehicle?.vehicle_number || log.vehicle?.model || "—"}</td><td className="p-4">{log.service_date || "—"}</td><td className="p-4 font-semibold text-rose-700">{money(log.amount)}</td><td className="p-4">{log.odometer || "—"}</td><td className="p-4 text-right"><button type="button" onClick={() => remove(log)} className="font-semibold text-red-600">Delete</button></td></tr>)}</tbody></table>}</div></div>;
}
