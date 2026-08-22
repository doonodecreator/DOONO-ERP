import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import PageContainer from "../components/layout/PageContainer";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";

const emptyForm = { name: "", short_name: "", email: "", phone: "", address: "" };

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => { loadOrganizations(); }, []);

  async function loadOrganizations() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/organizations");
      const data = response.data?.data?.data ?? response.data?.data ?? response.data ?? [];
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Organizations could not be loaded.");
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await api.post("/organizations", formData);
      setShowForm(false);
      setFormData(emptyForm);
      await loadOrganizations();
    } catch (requestError) {
      setError(requestError.message || "The organization could not be created.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && organizations.length === 0) return <PageContainer><LoadingSpinner label="Loading organizations" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Organizations" subtitle="Platform-wide organization management" action={<Button variant={showForm ? "danger" : "primary"} onClick={() => setShowForm((open) => !open)}>{showForm ? "Cancel" : "New organization"}</Button>} />
      {error && <Alert variant="error" action={<Button size="sm" variant="secondary" onClick={loadOrganizations}>Retry</Button>}>{error}</Alert>}

      {showForm && (
        <SectionCard title="Create organization" subtitle="Add the organization owner and contact details.">
          <form onSubmit={handleCreate} className="ui-form-grid">
            <FormField label="Organization name" htmlFor="organization-name" required>
              <input id="organization-name" name="name" className="ui-form-control" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
            </FormField>
            <FormField label="Short name" htmlFor="organization-short-name" hint="For example, DOONO" required>
              <input id="organization-short-name" name="short_name" className="ui-form-control" value={formData.short_name} onChange={(event) => setFormData({ ...formData, short_name: event.target.value })} required />
            </FormField>
            <FormField label="Contact email" htmlFor="organization-email" required>
              <input id="organization-email" type="email" name="email" className="ui-form-control" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
            </FormField>
            <FormField label="Contact phone" htmlFor="organization-phone" required>
              <input id="organization-phone" name="phone" className="ui-form-control" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} required />
            </FormField>
            <FormField label="Office address" htmlFor="organization-address">
              <textarea id="organization-address" name="address" className="ui-form-control" value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} />
            </FormField>
            <FormActions sticky={false}>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving} loadingText="Creating…">Create organization</Button>
            </FormActions>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Organizations" subtitle="Review organizations registered on the platform.">
        <DataTable
          columns={[
            { key: "name", label: "Organization" },
            { key: "owner", label: "Owner", render: (row) => row.owner?.name || "—" },
            { key: "status", label: "Status" },
          ]}
          data={organizations}
          loading={loading}
          emptyTitle="No organizations found"
          emptyMessage="Create the first organization to begin platform setup."
        />
      </SectionCard>
    </PageContainer>
  );
}
