import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import { useAuth } from "../context/AuthContext";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const currency = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));
const blankProfile = { name: "", short_name: "", registration_number: "", email: "", phone: "", alternative_phone: "", website: "", country: "", state: "", lga: "", address: "" };

export default function OrganizationOwnerWorkspace({ defaultTab = "organization-users", setPage }) {
  const { refreshContext } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [workspace, setWorkspace] = useState({ organization: null, schools: [], users: [], reports: {} });
  const [profile, setProfile] = useState(blankProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/org-owner/workspace");
      const payload = response?.data || {};
      const organization = payload.organization || null;
      setWorkspace({ organization, schools: safeArray(payload.schools), users: safeArray(payload.users), reports: payload.reports || {} });
      setProfile({ ...blankProfile, ...(organization || {}) });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Organization workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, []);

  const tabs = useMemo(() => [
    { key: "organization-users", label: "Users" },
    { key: "organization-profile", label: "Organization Profile" },
    { key: "organization-reports", label: "Reports" },
  ], []);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!workspace.organization?.id) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await api.put(`/organizations/${workspace.organization.id}`, profile);
      setNotice("Organization profile saved successfully.");
      await loadWorkspace();
    } catch (requestError) {
      const validation = requestError?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : requestError?.response?.data?.message || "Organization profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const switchSchool = async (schoolId) => {
    setError("");
    try {
      await api.post("/me/switch-school", { school_id: schoolId });
      await refreshContext();
      window.location.href = "/";
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "The school context could not be opened.");
    }
  };

  const deleteSchool = async (school) => {
    if (!window.confirm(`Delete ${school.name}? This action is only allowed when the school has no dependent records.`)) return;
    try {
      await api.delete(`/schools/${school.id}`);
      await loadWorkspace();
      setNotice("School deleted successfully.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "School could not be deleted.");
    }
  };

  if (loading) return <LoadingSpinner text="Loading organization workspace..." />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Organization Owner Workspace" description="Manage your organization, owned schools, staff users, billing access, and consolidated reports." />
      {error && <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadWorkspace} className="font-semibold underline">Retry</button></div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{tab.label}</button>)}
        <button type="button" onClick={() => setPage?.("subscriptions")} className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Billing & Subscription</button>
      </div>

      {activeTab === "organization-users" && <div className="space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">School Users</h2><p className="text-sm text-slate-500">Read-only organization-wide view of staff accounts across your owned schools.</p></div><button type="button" onClick={() => setPage?.("add-school")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create School</button></div>
        {workspace.users.length === 0 ? <EmptyState title="No school users found" description="Staff users linked to your owned schools will appear here." /> : <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role / Designation</th><th className="p-4">School</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{workspace.users.map((user) => <tr key={user.id}><td className="p-4 font-medium">{user.name || "—"}</td><td className="p-4">{user.email || "No linked email"}</td><td className="p-4">{user.designation || "—"}</td><td className="p-4">{user.school || "—"}</td><td className="p-4">{user.employment_status || "—"}</td></tr>)}</tbody></table></div>}
      </div>}

      {activeTab === "organization-profile" && <form onSubmit={saveProfile} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-lg font-bold text-slate-900">Organization Profile</h2><p className="mt-1 text-sm text-slate-500">Edit the organization identity used across your owned schools.</p><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">{Object.keys(blankProfile).map((field) => <label key={field} className="text-sm font-medium capitalize text-slate-600">{field.replaceAll("_", " ")}<input value={profile[field] || ""} onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>)}</div><div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Organization Profile"}</button></div></form>}

      {activeTab === "organization-reports" && <div className="space-y-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Schools</p><strong className="mt-2 block text-2xl">{workspace.reports.school_count || 0}</strong></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Active staff users</p><strong className="mt-2 block text-2xl">{workspace.reports.active_users || 0}</strong></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Recorded school income</p><strong className="mt-2 block text-2xl text-emerald-700">{currency(workspace.reports.income)}</strong></div></div><div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">School</th><th className="p-4">Type</th><th className="p-4">Status</th><th className="p-4 text-right">Income</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y">{workspace.schools.map((school) => <tr key={school.id}><td className="p-4 font-medium">{school.name}</td><td className="p-4">{school.school_type || "—"}</td><td className="p-4">{school.status || "—"}</td><td className="p-4 text-right font-semibold text-emerald-700">{currency(school.income)}</td><td className="p-4 text-right"><div className="flex justify-end gap-3"><button type="button" onClick={() => switchSchool(school.id)} className="font-semibold text-blue-700">Manage</button><button type="button" onClick={() => deleteSchool(school)} className="font-semibold text-red-600">Delete</button></div></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}
