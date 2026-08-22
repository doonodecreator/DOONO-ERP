import { useEffect, useMemo, useState } from "react";
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

const CONFIG = {
  hostel: { title: "Hostel Reports", description: "Review hostel capacity, room occupancy, allocations, and visitor activity.", requests: [["hostels", "/hostels"], ["rooms", "/hostel-rooms"], ["allocations", "/hostel-allocations"], ["visitors", "/visitors"]] },
  transport: { title: "Transport Reports", description: "Review vehicles, routes, student allocations, and transport coverage.", requests: [["vehicles", "/vehicles"], ["routes", "/transport-routes"], ["allocations", "/transport-allocations"]] },
  reception: { title: "Reception Reports", description: "Review visitor, gate-pass, and appointment activity for the school front desk.", requests: [["visitors", "/visitors"], ["gatePasses", "/gate-passes"], ["appointments", "/appointments"]] },
};

export default function OperationalReports({ mode = "hostel" }) {
  const config = CONFIG[mode] || CONFIG.hostel;
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const result = {};
    const failures = [];
    for (const [key, endpoint] of config.requests) {
      try {
        const response = await api.get(endpoint);
        result[key] = safeArray(response?.data);
      } catch (requestError) {
        result[key] = [];
        failures.push(`${key}: ${requestError?.response?.data?.message || "request failed"}`);
      }
    }
    setRecords(result);
    if (failures.length) setError(failures.join("; "));
    setLoading(false);
  };

  useEffect(() => { load(); }, [mode]);

  const cards = useMemo(() => config.requests.map(([key, label]) => ({ key, label: label.replace("/", "").replaceAll("-", " "), count: safeArray(records[key]).length })), [config, records]);
  if (loading) return <LoadingSpinner text={`Loading ${config.title.toLowerCase()}...`} />;

  return <div className="space-y-6 p-4 md:p-6"><PageHeader title={config.title} description={config.description} />{error && <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{cards.map((card) => <div key={card.key} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p><strong className="mt-2 block text-2xl text-slate-900">{card.count}</strong></div>)}</div>
    {mode === "hostel" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{safeArray(records.rooms).length === 0 ? <EmptyState title="No hostel rooms" description="Create rooms and allocations from the Hostel workspace before reviewing occupancy." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Room</th><th className="p-4">Hostel</th><th className="p-4">Capacity</th><th className="p-4">Occupied</th></tr></thead><tbody className="divide-y">{safeArray(records.rooms).map((room) => <tr key={room.id}><td className="p-4 font-medium">{room.room_number || room.name || "—"}</td><td className="p-4">{room.hostel?.name || room.hostel_name || "—"}</td><td className="p-4">{room.capacity ?? "—"}</td><td className="p-4">{room.occupied_beds ?? room.current_occupancy ?? "—"}</td></tr>)}</tbody></table>}</div>}
    {mode === "transport" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{safeArray(records.allocations).length === 0 ? <EmptyState title="No transport allocations" description="Assign students to transport routes before reviewing coverage." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Student</th><th className="p-4">Route</th><th className="p-4">Pickup point</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{safeArray(records.allocations).map((item) => <tr key={item.id}><td className="p-4 font-medium">{item.student?.full_name || item.student_name || "—"}</td><td className="p-4">{item.route?.name || item.route_name || "—"}</td><td className="p-4">{item.pickup_point || "—"}</td><td className="p-4">{item.status || "Active"}</td></tr>)}</tbody></table>}</div>}
    {mode === "reception" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{safeArray(records.visitors).length === 0 && safeArray(records.gatePasses).length === 0 && safeArray(records.appointments).length === 0 ? <EmptyState title="No reception activity" description="Visitor, gate-pass, and appointment records will appear here." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Visitor</th><th className="p-4">Purpose</th><th className="p-4">Check in</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{safeArray(records.visitors).map((visitor) => <tr key={visitor.id}><td className="p-4 font-medium">{visitor.visitor_name || "—"}</td><td className="p-4">{visitor.purpose || "—"}</td><td className="p-4">{visitor.check_in_time || "—"}</td><td className="p-4">{visitor.status || "—"}</td></tr>)}</tbody></table>}</div>}
  </div>;
}
