import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const arrayFrom = (response) => {
  const value = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

export default function TransportTracking() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const endpoint = role === "student" ? "/student/transport-tracking" : "/portal/transport-tracking";
      const response = await api.get(endpoint);
      setItems(arrayFrom(response));
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || "Unable to load transport tracking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [role]);

  return <PageContainer><PageHeader title="Transport Tracking" subtitle="View the current route and vehicle allocation for your linked student." />{error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></div>}{loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState title="No transport allocation" message="Your school has not assigned a transport route to this student yet." /> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm"><h2 className="font-semibold text-slate-900">{item.student?.full_name || "Student"}</h2><p className="mt-2 text-sm text-slate-600">Route: {item.route?.name || "Not specified"}</p><p className="text-sm text-slate-600">Vehicle: {item.route?.vehicle?.registration_number || item.route?.vehicle?.plate_number || "Not specified"}</p><p className="text-sm text-slate-600">Pickup point: {item.pickup_point || "Not specified"}</p></article>)}</div>}</PageContainer>;
}
