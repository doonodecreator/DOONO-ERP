import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";

const EMPTY_FORM = {
  slug: "",
  name: "",
  publisher: "",
  description: "",
  homepage_url: "",
  capabilities: "",
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function MarketplaceAdmin() {
  const { isPlatformAdmin } = useAuth();
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/platform/marketplace/apps");
      setApps(safeArray(response?.data?.data));
    } catch (requestError) {
      setApps([]);
      setError(requestError?.response?.data?.message || "Unable to load marketplace catalogue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPlatformAdmin) load();
    else setLoading(false);
  }, [isPlatformAdmin]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createApp(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/platform/marketplace/apps", {
        slug: form.slug.trim(),
        name: form.name.trim(),
        publisher: form.publisher.trim(),
        description: form.description.trim(),
        homepage_url: form.homepage_url.trim() || null,
        capabilities: form.capabilities.split(",").map((item) => item.trim()).filter(Boolean),
        status: "draft",
      });
      setForm(EMPTY_FORM);
      setNotice("Marketplace entry created as a draft. Review it before publication.");
      await load();
    } catch (requestError) {
      const validation = requestError?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : (requestError?.response?.data?.message || "Unable to create marketplace entry."));
    } finally {
      setSaving(false);
    }
  }

  async function updateApp(app, payload, successMessage) {
    setWorkingId(app.id);
    setError("");
    setNotice("");
    try {
      await api.put(`/platform/marketplace/apps/${app.id}`, payload);
      setNotice(successMessage);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update marketplace entry.");
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteApp(app) {
    if (!window.confirm(`Delete ${app.name}? Installed entries cannot be deleted.`)) return;
    setWorkingId(app.id);
    setError("");
    setNotice("");
    try {
      await api.delete(`/platform/marketplace/apps/${app.id}`);
      setNotice("Marketplace entry deleted.");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to delete marketplace entry.");
    } finally {
      setWorkingId(null);
    }
  }

  if (!isPlatformAdmin) {
    return <PageContainer><EmptyState title="Platform owner access required" message="Marketplace publication and security review are restricted to the Software Owner." /></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="Marketplace review" subtitle="Review approved integrations before schools can see or install them. Installation records configuration but never executes arbitrary plugin code." />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <SectionCard title="Add catalogue entry" subtitle="New entries always begin as drafts and must be reviewed before publication.">
        <form onSubmit={createApp} className="grid gap-4 md:grid-cols-2">
          <FormField label="Slug" htmlFor="marketplace-slug" required hint="Stable alpha-numeric identifier used by integrations."><input id="marketplace-slug" className="ui-form-input" required maxLength={100} value={form.slug} onChange={(event) => updateField("slug", event.target.value)} /></FormField>
          <FormField label="Name" htmlFor="marketplace-name" required><input id="marketplace-name" className="ui-form-input" required maxLength={160} value={form.name} onChange={(event) => updateField("name", event.target.value)} /></FormField>
          <FormField label="Publisher" htmlFor="marketplace-publisher" required><input id="marketplace-publisher" className="ui-form-input" required maxLength={160} value={form.publisher} onChange={(event) => updateField("publisher", event.target.value)} /></FormField>
          <FormField label="Homepage URL" htmlFor="marketplace-homepage"><input id="marketplace-homepage" className="ui-form-input" type="url" maxLength={500} value={form.homepage_url} onChange={(event) => updateField("homepage_url", event.target.value)} /></FormField>
          <FormField label="Capabilities" htmlFor="marketplace-capabilities" hint="Comma-separated descriptive capabilities; this does not grant runtime permissions."><input id="marketplace-capabilities" className="ui-form-input" value={form.capabilities} onChange={(event) => updateField("capabilities", event.target.value)} /></FormField>
          <FormField label="Description" htmlFor="marketplace-description" required><textarea id="marketplace-description" className="ui-form-input" required maxLength={5000} value={form.description} onChange={(event) => updateField("description", event.target.value)} /></FormField>
          <FormActions><Button type="submit" loading={saving} loadingText="Creating…">Create draft</Button></FormActions>
        </form>
      </SectionCard>
      <SectionCard title="Catalogue entries" subtitle="Approve only integrations that have completed your security and privacy review.">
        {loading ? <LoadingSpinner text="Loading marketplace catalogue…" /> : apps.length === 0 ? <EmptyState title="No catalogue entries" message="Create the first integration as a draft." /> : <div className="grid gap-4">{apps.map((app) => {
          const busy = workingId === app.id;
          const reviewStatus = app.review_status || "pending";
          return <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{app.name}</h2><p className="text-sm text-slate-500">{app.slug} · {app.publisher}</p></div><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{app.status || "draft"}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">review: {reviewStatus}</span></div></div>
            <p className="mt-3 text-sm text-slate-600">{app.description}</p>
            {Array.isArray(app.capabilities) && app.capabilities.length > 0 && <p className="mt-3 text-xs text-slate-500">Declared capabilities: {app.capabilities.join(", ")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {reviewStatus !== "approved" && <Button size="sm" loading={busy} onClick={() => updateApp(app, { review_status: "approved", security_notes: "Reviewed by the Software Owner." }, "Entry approved for publication.")}>Approve review</Button>}
              {reviewStatus !== "rejected" && <Button size="sm" variant="warning" loading={busy} onClick={() => updateApp(app, { review_status: "rejected", status: "disabled", security_notes: "Rejected during platform review." }, "Entry rejected and disabled.")}>Reject</Button>}
              {reviewStatus === "approved" && app.status !== "published" && <Button size="sm" loading={busy} onClick={() => updateApp(app, { status: "published" }, "Entry published for school Proprietors.")}>Publish</Button>}
              {app.status === "published" && <Button size="sm" variant="warning" loading={busy} onClick={() => updateApp(app, { status: "disabled" }, "Entry disabled for new installations.")}>Disable</Button>}
              {app.status !== "draft" && reviewStatus !== "pending" && <Button size="sm" variant="secondary" loading={busy} onClick={() => updateApp(app, { status: "draft", review_status: "pending" }, "Entry returned to draft review.")}>Return to draft</Button>}
              {Number(app.installations_count || 0) === 0 && <Button size="sm" variant="danger" loading={busy} onClick={() => deleteApp(app)}>Delete</Button>}
            </div>
          </article>;
        })}</div>}
      </SectionCard>
    </PageContainer>
  );
}
