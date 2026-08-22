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
const blank = { type: "staff_check_in", staff_id: "", contact_name: "", phone: "", subject: "", message: "", status: "open" };

export default function ReceptionActivities({ defaultType = "staff_check_in" }) {
  const [type, setType] = useState(defaultType);
  const [activities, setActivities] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ ...blank, type: defaultType });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [activityResponse, staffResponse] = await Promise.all([api.get("/reception-activities", { params: { type } }), api.get("/staff")]);
      setActivities(safeArray(activityResponse?.data));
      setStaff(safeArray(staffResponse?.data));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Reception activity data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { setForm((current) => ({ ...current, type })); load(); }, [type]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/reception-activities", { ...form, type, staff_id: form.staff_id || null });
      setForm({ ...blank, type });
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Reception activity could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const close = async (activity) => {
    try { await api.put(`/reception-activities/${activity.id}`, { status: "closed" }); await load(); } catch (requestError) { setError(requestError?.response?.data?.message || "Status could not be updated."); }
  };

  const remove = async (activity) => {
    if (!window.confirm("Delete this reception activity?")) return;
    try { await api.delete(`/reception-activities/${activity.id}`); await load(); } catch (requestError) { setError(requestError?.response?.data?.message || "Activity could not be deleted."); }
  };

  if (loading) return <LoadingSpinner text="Loading reception activities..." />;
  const isCheckIn = type === "staff_check_in";
  return <div className="space-y-6 p-4 md:p-6"><PageHeader title={isCheckIn ? "Staff Check-in" : "Calls & Messages"} description={isCheckIn ? "Record staff arrival and attendance activity at the front desk." : "Log calls and messages received or sent by the school front desk."} />{error && <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}<div className="flex gap-2"><button type="button" onClick={() => setType("staff_check_in")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isCheckIn ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Staff Check-in</button><button type="button" onClick={() => setType("call")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!isCheckIn ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Calls / Messages</button></div>
    <form onSubmit={save} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{isCheckIn ? <label className="text-sm font-medium text-slate-600">Staff member<select required value={form.staff_id} onChange={(event) => setForm((current) => ({ ...current, staff_id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select staff member</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.full_name || `${member.first_name || ""} ${member.last_name || ""}`.trim()}</option>)}</select></label> : <><label className="text-sm font-medium text-slate-600">Contact name<input required value={form.contact_name} onChange={(event) => setForm((current) => ({ ...current, contact_name: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-600">Phone<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></>} {!isCheckIn && <label className="text-sm font-medium text-slate-600">Subject<input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>}<label className="text-sm font-medium text-slate-600 md:col-span-2">{isCheckIn ? "Notes" : "Message"}<textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows="3" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : isCheckIn ? "Record Check-in" : "Log Message"}</button></div></form>
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{activities.length === 0 ? <EmptyState title={`No ${isCheckIn ? "staff check-ins" : "calls or messages"}`} description="New reception activity records will appear here." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Person / Contact</th><th className="p-4">Subject / Note</th><th className="p-4">Logged</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y">{activities.map((activity) => <tr key={activity.id}><td className="p-4 font-medium">{activity.staff?.full_name || activity.contact_name || "—"}</td><td className="p-4">{activity.subject || activity.message || "—"}</td><td className="p-4">{activity.logged_at || "—"}</td><td className="p-4">{activity.status || "open"}</td><td className="p-4 text-right"><div className="flex justify-end gap-3">{activity.status !== "closed" && <button type="button" onClick={() => close(activity)} className="font-semibold text-emerald-700">Close</button>}<button type="button" onClick={() => remove(activity)} className="font-semibold text-red-600">Delete</button></div></td></tr>)}</tbody></table>}</div>
  </div>;
}
