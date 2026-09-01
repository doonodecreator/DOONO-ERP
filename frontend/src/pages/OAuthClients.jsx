import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";
import "./SchoolApiKeys.css";

const SCOPES = [
  ["school.read", "School profile read"],
  ["students.read", "Active student directory read"],
  ["fees.read", "Fees and invoices read"],
  ["fees.write", "Fee-payment recording write"],
  ["attendance.write", "Attendance synchronization write"],
];

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function OAuthClients() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: "", scopes: ["school.read"] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newCredentials, setNewCredentials] = useState(null);

  const loadClients = async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/oauth-clients", { params: { page: requestedPage } });
      const payload = response?.data || {};
      setRows(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(payload?.meta && typeof payload.meta === "object" ? payload.meta : null);
      setPage(Number(payload?.meta?.current_page || requestedPage));
    } catch (err) {
      setRows([]);
      setPagination(null);
      setError(err?.response?.data?.message || "Unable to load OAuth clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(1); }, []);

  const toggleScope = (scope) => {
    setForm((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }));
  };

  const createClient = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    setNewCredentials(null);
    try {
      const response = await api.post("/oauth-clients", {
        name: form.name.trim(),
        scopes: form.scopes,
      });
      const created = response?.data?.data;
      setNewCredentials(created && typeof created === "object" ? created : null);
      setNotice(response?.data?.message || "OAuth client created.");
      setForm({ name: "", scopes: ["school.read"] });
      await loadClients(1);
    } catch (err) {
      const validation = err?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : (err?.response?.data?.message || "Unable to create OAuth client."));
    } finally {
      setSaving(false);
    }
  };

  const revokeClient = async (client) => {
    if (!window.confirm(`Revoke “${client.name}”? Existing OAuth tokens will stop working.`)) return;
    setError("");
    setNotice("");
    try {
      await api.post(`/oauth-clients/${client.id}/revoke`);
      setNotice("OAuth client revoked.");
      await loadClients(page);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to revoke OAuth client.");
    }
  };

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied. Store it in a secret manager; the client secret will not be shown again.`);
    } catch {
      setError(`Copy was blocked. Select and copy the ${label.toLowerCase()} manually now.`);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "client_id", label: "Client ID", render: (row) => <code>{row.client_id}</code> },
    { key: "scopes", label: "Scopes", render: (row) => Array.isArray(row.scopes) ? row.scopes.join(", ") : "None" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    { key: "revoked", label: "Status", render: (row) => row.revoked ? "Revoked" : "Active" },
    { key: "actions", label: "Actions", render: (row) => row.revoked ? <span>—</span> : <Button size="sm" variant="danger" onClick={(event) => { event.stopPropagation(); revokeClient(row); }}>Revoke</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader title="OAuth integrations" subtitle="Create confidential, school-scoped OAuth clients for approved systems. Each client receives only the scopes you select." />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      {newCredentials && (
        <SectionCard title="Copy the client secret now" subtitle="DOONO stores the secret as a one-way hash. It will never be displayed again after this response is closed or refreshed.">
          <div className="api-key-secret-row">
            <div><strong>Client ID</strong><code>{newCredentials.client_id}</code></div>
            <Button type="button" onClick={() => copy(newCredentials.client_id, "Client ID")}>Copy ID</Button>
          </div>
          <div className="api-key-secret-row">
            <div><strong>Client secret</strong><code>{newCredentials.client_secret}</code></div>
            <Button type="button" onClick={() => copy(newCredentials.client_secret, "Client secret")}>Copy secret</Button>
          </div>
        </SectionCard>
      )}
      <SectionCard title="Create an OAuth client" subtitle="Use client credentials for server-to-server integrations. Never place the client secret in a browser or mobile app.">
        <form onSubmit={createClient}>
          <FormField label="Client name" htmlFor="oauth-client-name" required hint="Use a recognizable name, such as School Accounting Sync or Approved Parent App.">
            <input id="oauth-client-name" className="ui-form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={120} />
          </FormField>
          <fieldset className="ui-form-fieldset">
            <legend className="ui-form-label">Allowed scopes <span aria-hidden="true" className="ui-form-required"> *</span></legend>
            {SCOPES.map(([scope, label]) => (
              <label className="api-key-scope" key={scope}>
                <input type="checkbox" checked={form.scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                <span><strong>{label}</strong><small>{scope}</small></span>
              </label>
            ))}
          </fieldset>
          <FormActions><Button type="submit" loading={saving} loadingText="Creating…">Create OAuth client</Button></FormActions>
        </form>
      </SectionCard>
      <SectionCard title="How the integration authenticates" subtitle="The token endpoint is on the same backend host as the API. Access tokens expire after the configured short lifetime.">
        <p>Use <code>POST /oauth/token</code> with <code>grant_type=client_credentials</code>, the client ID, the client secret, and space-separated scopes. Send the returned access token as a bearer token to the documented integration endpoints.</p>
        <p><strong>Write protection:</strong> OAuth write operations are limited to fee-payment recording and attendance synchronization. Fee payments require <code>fees.write</code>, a school-owned invoice, a positive amount that does not exceed the outstanding balance, a stable transaction reference, and an <code>Idempotency-Key</code>. Attendance requires <code>attendance.write</code>, an active staff attribution, school-owned enrollments, and an <code>Idempotency-Key</code>.</p>
      </SectionCard>
      <SectionCard title="Issued OAuth clients" subtitle="Revoke a client immediately when its system is no longer trusted. Revocation also invalidates its issued tokens.">
        <DataTable columns={columns} data={rows} loading={loading} pagination={pagination} onPageChange={loadClients} emptyTitle="No OAuth clients yet" emptyMessage="Create the first school-scoped OAuth client above." />
      </SectionCard>
    </PageContainer>
  );
}
