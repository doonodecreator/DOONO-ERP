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
  ["school.read", "School profile"],
  ["students.read", "Active student directory"],
  ["fees.read", "Fees and invoices read access"],
];

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function SchoolApiKeys() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: "", scopes: ["school.read"], expires_at: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newSecret, setNewSecret] = useState("");

  const loadKeys = async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/school-api-keys", { params: { page: requestedPage } });
      const payload = response?.data?.data;
      setRows(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(payload || null);
      setPage(Number(payload?.current_page || requestedPage));
    } catch (err) {
      setRows([]);
      setPagination(null);
      setError(err?.response?.data?.message || "Unable to load school API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(1); }, []);

  const toggleScope = (scope) => {
    setForm((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }));
  };

  const createKey = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    setNewSecret("");
    try {
      const response = await api.post("/school-api-keys", {
        name: form.name.trim(),
        scopes: form.scopes,
        expires_at: form.expires_at || null,
      });
      setNewSecret(response?.data?.data?.key || "");
      setNotice(response?.data?.message || "API key created.");
      setForm({ name: "", scopes: ["school.read"], expires_at: "" });
      await loadKeys(1);
    } catch (err) {
      const validation = err?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : (err?.response?.data?.message || "Unable to create API key."));
    } finally {
      setSaving(false);
    }
  };

  const revokeKey = async (key) => {
    if (!window.confirm(`Revoke the key “${key.name}”? Existing integrations will stop working.`)) return;
    setError("");
    setNotice("");
    try {
      await api.post(`/school-api-keys/${key.id}/revoke`);
      setNotice("API key revoked.");
      await loadKeys(page);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to revoke API key.");
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(newSecret);
      setNotice("API key copied to the clipboard. Store it in your integration’s secret manager.");
    } catch {
      setError("Copy was blocked by the browser. Select and copy the key manually now; it will not be shown again.");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "key_prefix", label: "Prefix" },
    { key: "scopes", label: "Scopes", render: (row) => Array.isArray(row.scopes) ? row.scopes.join(", ") : "None" },
    { key: "expires_at", label: "Expires", render: (row) => formatDate(row.expires_at) },
    { key: "last_used_at", label: "Last used", render: (row) => formatDate(row.last_used_at) },
    { key: "revoked_at", label: "Status", render: (row) => row.revoked_at ? "Revoked" : "Active" },
    { key: "actions", label: "Actions", render: (row) => row.revoked_at ? <span>—</span> : <Button size="sm" variant="danger" onClick={(event) => { event.stopPropagation(); revokeKey(row); }}>Revoke</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader title="School API keys" subtitle="Create limited, school-scoped credentials for approved integrations. The secret is displayed only once." />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      {newSecret && (
        <SectionCard title="Copy this secret now" subtitle="DOONO stores only a one-way hash. If you lose this value, revoke the key and create another.">
          <div className="api-key-secret-row">
            <code>{newSecret}</code>
            <Button type="button" onClick={copySecret}>Copy key</Button>
          </div>
        </SectionCard>
      )}
      <SectionCard title="Create a school integration key" subtitle="Start with the smallest set of read permissions your integration needs. Keys cannot write school data.">
        <form onSubmit={createKey}>
          <FormField label="Key name" htmlFor="school-api-key-name" required hint="Use a recognizable name, such as Parent App or Accounting Export.">
            <input id="school-api-key-name" className="ui-form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={120} />
          </FormField>
          <FormField label="Expiry date" htmlFor="school-api-key-expires" hint="Optional. Short-lived keys reduce risk. Leave empty only when your operational policy allows it.">
            <input id="school-api-key-expires" type="date" className="ui-form-input" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} />
          </FormField>
          <fieldset className="ui-form-fieldset">
            <legend className="ui-form-label">Read scopes <span aria-hidden="true" className="ui-form-required"> *</span></legend>
            {SCOPES.map(([scope, label]) => (
              <label className="api-key-scope" key={scope}>
                <input type="checkbox" checked={form.scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                <span><strong>{label}</strong><small>{scope}</small></span>
              </label>
            ))}
          </fieldset>
          <FormActions><Button type="submit" loading={saving} loadingText="Creating…">Create API key</Button></FormActions>
        </form>
      </SectionCard>
      <SectionCard title="Issued keys" subtitle="Review usage and revoke credentials immediately when an integration is no longer trusted.">
        <DataTable columns={columns} data={rows} loading={loading} pagination={pagination} onPageChange={loadKeys} emptyTitle="No API keys yet" emptyMessage="Create the first school-scoped integration key above." />
      </SectionCard>
    </PageContainer>
  );
}
