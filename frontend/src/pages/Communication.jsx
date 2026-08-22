import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Pagination from "../components/tables/Pagination";
import SectionCard from "../components/layout/SectionCard";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";
import { paginatedFromResponse } from "../utils/response";
import "./Communication.css";

const emptyForm = {
  type: "notice",
  audience: "all",
  recipient_id: "",
  subject: "",
  body: "",
  is_published: true,
};

const MANAGEMENT_ROLES = new Set([
  "proprietor",
  "principal",
  "vice_principal_academic",
  "vice_principal_admin",
]);

function toItems(response) {
  const value = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function isPublished(item) {
  return item?.is_published === true || item?.is_published === 1 || item?.is_published === "1";
}

export default function Communication({ mode = "all" }) {
  const { user, roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canSend = [
    "proprietor", "principal", "vice_principal_academic", "vice_principal_admin",
    "teacher", "form_teacher", "nursery_head", "primary_headmaster",
    "secondary_principal", "receptionist",
  ].includes(role);
  const canManageAll = MANAGEMENT_ROLES.has(role) || isPlatformAdmin;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const title = mode === "notices" ? "School Notices" : mode === "messages" ? "Messages & Chat" : "Communication";
  const typeFilter = mode === "notices" ? "notice" : mode === "messages" ? "message" : "";

  async function load(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/communications", {
        params: typeFilter ? { type: typeFilter, per_page: 25, page: nextPage } : { per_page: 25, page: nextPage },
      });
      const result = paginatedFromResponse(response);
      setItems(Array.isArray(result.data) ? result.data : []);
      setMeta(result.meta);
      setPage(nextPage);
    } catch (err) {
      setItems([]);
      setMeta(null);
      setError(err?.response?.data?.message || "Unable to load communication records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [typeFilter]);

  const visibleItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function beginCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setForm({
      type: item.type || "notice",
      audience: item.audience || "all",
      recipient_id: item.recipient_id || "",
      subject: item.subject || "",
      body: item.body || "",
      is_published: isPublished(item),
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function canManage(item) {
    return canManageAll || Number(item?.sender_id) === Number(user?.id);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        recipient_id: form.recipient_id ? Number(form.recipient_id) : null,
        is_published: Boolean(form.is_published),
      };
      if (editingId) {
        await api.put(`/communications/${editingId}`, payload);
        setMessage(payload.is_published ? "Communication updated and published." : "Communication saved as a draft.");
      } else {
        await api.post("/communications", payload);
        setMessage(payload.is_published ? "Communication published successfully." : "Draft saved successfully.");
      }
      closeForm();
      await load();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)?.flat()?.[0] : null;
      setError(first || err?.response?.data?.message || "Unable to save communication.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item) {
    try {
      setActionId(item.id);
      setError("");
      setMessage("");
      const nextState = !isPublished(item);
      await api.put(`/communications/${item.id}`, { is_published: nextState });
      setMessage(nextState ? "Communication republished." : "Communication taken down and saved as a draft.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to change publication status.");
    } finally {
      setActionId(null);
    }
  }

  async function remove(item) {
    if (!window.confirm("Delete this communication permanently?")) return;
    try {
      setActionId(item.id);
      setError("");
      setMessage("");
      await api.delete(`/communications/${item.id}`);
      setMessage("Communication deleted.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete communication.");
    } finally {
      setActionId(null);
    }
  }

  async function markRead(item) {
    if (!item?.id || item.read_at) return;
    try {
      await api.post(`/communications/${item.id}/read`);
      setItems((current) => (Array.isArray(current) ? current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry) : []));
    } catch {
      // Reading is best effort; the message remains visible if the write is denied.
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle="School-scoped notices and messages for the right audience."
        action={canSend ? <Button variant="primary" onClick={showForm ? closeForm : beginCreate}>{showForm ? "Close" : "New communication"}</Button> : null}
      />

      {error && <div role="alert" className="communication-feedback communication-feedback-error">{error}<button type="button" onClick={load}>Retry</button></div>}
      {message && <div role="status" className="communication-feedback communication-feedback-success">{message}</div>}

      {showForm && canSend && (
        <SectionCard title={editingId ? "Edit communication" : "Create communication"} subtitle="Choose the audience, write the message, and publish it when ready." className="communication-compose-card">
          <form onSubmit={submit} className="communication-form">
            <div className="communication-form-grid">
              <FormField label="Type" htmlFor="communication-type">
                <select id="communication-type" value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                  <option value="notice">Notice</option>
                  <option value="message">Message</option>
                </select>
              </FormField>
              <FormField label="Audience" htmlFor="communication-audience">
                <select id="communication-audience" value={form.audience} onChange={(event) => updateField("audience", event.target.value)}>
                  <option value="all">Everyone</option>
                  <option value="staff">Staff</option>
                  <option value="parents">Parents</option>
                  <option value="students">Students</option>
                  <option value="individual">Individual user</option>
                </select>
              </FormField>
              {form.audience === "individual" && (
                <FormField label="Recipient user ID" htmlFor="communication-recipient" required>
                  <input id="communication-recipient" required value={form.recipient_id} onChange={(event) => updateField("recipient_id", event.target.value)} inputMode="numeric" />
                </FormField>
              )}
            </div>
            <FormField label="Subject" htmlFor="communication-subject">
              <input id="communication-subject" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} maxLength={180} />
            </FormField>
            <FormField label="Message" htmlFor="communication-body" required>
              <textarea id="communication-body" required value={form.body} onChange={(event) => updateField("body", event.target.value)} maxLength={10000} />
            </FormField>
            <FormActions>
              <label className="communication-publish-toggle"><input type="checkbox" checked={form.is_published} onChange={(event) => updateField("is_published", event.target.checked)} /> Publish now</label>
              <div className="communication-form-actions">
                <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving}>{editingId ? "Save changes" : form.is_published ? "Publish" : "Save draft"}</Button>
              </div>
            </FormActions>
          </form>
        </SectionCard>
      )}

      {loading ? <LoadingSpinner text="Loading communication..." /> : visibleItems.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} yet`} message="Published school-scoped communication will appear here." /> : <div className="communication-list">{visibleItems.map((item) => {
        const published = isPublished(item);
        const manageable = canManage(item);
        return (
          <article key={item.id} onClick={() => markRead(item)} className={`communication-card ${item.read_at ? "" : "communication-card-unread"}`}>
            <div className="communication-card-header">
              <div className="communication-card-tags"><span className="communication-type">{item.type || "notice"}</span><span>To: {item.audience || "all"}</span><span className={`communication-state communication-state-${published ? "published" : "draft"}`}>{published ? "Published" : "Draft"}</span></div>
              <time>{published && item.published_at ? new Date(item.published_at).toLocaleString() : "Not published"}</time>
            </div>
            <h2>{item.subject || "School communication"}</h2>
            <p className="communication-body">{item.body}</p>
            <div className="communication-card-footer">
              <span>From: {item.sender?.name || "School staff"}</span>
              {manageable && <div className="communication-actions" onClick={(event) => event.stopPropagation()}>
                <Button size="sm" variant="secondary" onClick={() => beginEdit(item)}>Edit</Button>
                <Button size="sm" variant={published ? "warning" : "primary"} loading={actionId === item.id} onClick={() => togglePublished(item)}>{published ? "Take down" : "Republish"}</Button>
                <Button size="sm" variant="danger" loading={actionId === item.id} onClick={() => remove(item)}>Delete</Button>
              </div>}
            </div>
          </article>
        );
      })}</div>}
      {!loading && visibleItems.length > 0 && <Pagination meta={meta} loading={loading} onPageChange={(nextPage) => load(nextPage)} />}
    </PageContainer>
  );
}
