import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getPrimaryRoleSlug } from "../utils/role";
import { paginatedFromResponse } from "../utils/response";
import { CONCEPT_GUIDES, GUIDE_MODULE_KEYS_WITH_DOCUMENTS, moduleGuide, roleGuide } from "../config/guideKnowledge";
import { ARCHITECTURE_MODULES } from "../config/architectureModules";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import { useAuth } from "../context/AuthContext";

const initialForm = { subject: "", category: "general", priority: "normal", description: "" };
const categoryLabels = {
  general: "General question",
  account_access: "Account or login",
  billing: "Billing or subscription",
  academic: "Academic setup or results",
  finance: "Fees or payments",
  technical: "Technical problem",
  security: "Security concern",
  data_request: "Data request",
};
const statusLabels = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_user: "Waiting for your reply",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function SupportCentre() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(initialForm);
  const [reply, setReply] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [cannedReplies, setCannedReplies] = useState([]);
  const [cannedReplyKey, setCannedReplyKey] = useState("");

  const roleHelp = useMemo(() => roleGuide(role), [role]);

  useEffect(() => {
    const roleArticle = {
      id: "role-overview",
      title: `How to use DOONO as a ${roleHelp.label}`,
      category: "Your role",
      purpose: roleHelp.intro,
      definition: roleHelp.definition,
      primaryPurpose: roleHelp.primaryPurpose,
      worksWith: roleHelp.worksWith,
      firstChecks: roleHelp.firstChecks,
      canDo: Array.isArray(roleHelp.canDo) ? roleHelp.canDo : [],
      cannotDo: Array.isArray(roleHelp.cannotDo) ? roleHelp.cannotDo : [],
      dailyWorkflow: Array.isArray(roleHelp.dailyWorkflow) ? roleHelp.dailyWorkflow : [],
      steps: Array.isArray(roleHelp.steps) ? roleHelp.steps : [],
      next: "Start with the first incomplete step, then return to your dashboard to confirm the result.",
      commonMistakes: ["Starting before the correct school, session, or term is selected.", "Expecting a button to work without the required permission or prerequisite record.", "Leaving the page without checking the success message or updated list."],
      faqs: [{ question: "Why can I not see a record?", answer: "Check the active school, filters, enrollment state, and your role permissions before submitting a support request." }, { question: "What should I send to Support?", answer: "Send the screen, steps, expected result, actual result, error text, school, and approximate time. Never send a password or full payment-card details." }],
    };
    const moduleArticles = GUIDE_MODULE_KEYS_WITH_DOCUMENTS.map((key) => {
      const guide = moduleGuide(key);
      return {
        id: `module-${key}`,
        title: guide.title,
        category: "Module guide",
        purpose: guide.purpose,
        audience: guide.audience,
        whyItMatters: guide.whyItMatters,
        beforeYouStart: guide.beforeYouStart,
        fields: Array.isArray(guide.fields) ? guide.fields : [],
        controls: Array.isArray(guide.controls) ? guide.controls : [],
        successSignals: Array.isArray(guide.successSignals) ? guide.successSignals : [],
        steps: Array.isArray(guide.steps) ? guide.steps : [],
        next: guide.next,
        commonMistakes: ["Using the wrong school, session, term, class, or child context.", "Skipping a prerequisite setup step.", "Leaving without confirming that the saved record, status, or dashboard number changed."],
        faqs: [{ question: "Why is a field empty?", answer: "The previous setup step may not be complete, the selected context may be wrong, or your role may not have access to that data." }, { question: "What if the workflow stops?", answer: "Read the validation message, correct the named field, retry once, and open Support Centre with the exact error if it continues." }],
      };
    });
    setArticles([roleArticle, ...moduleArticles]);
  }, [roleHelp]);

  async function loadTickets(page = 1) {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/support-tickets", { params: { page, per_page: 15, search: search || undefined, status: status || undefined, category: category || undefined } });
      const result = paginatedFromResponse(response);
      setTickets(Array.isArray(result.data) ? result.data : []);
      setPagination(result.meta);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load support requests.");
      setTickets([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(); }, [status, category]);
  useEffect(() => { if (!isPlatformAdmin) return; api.get("/support/canned-replies").then((response) => { const data = response?.data?.data; setCannedReplies(Array.isArray(data) ? data : []); }).catch(() => setCannedReplies([])); }, [isPlatformAdmin]);

  async function openTicket(ticket) {
    setError("");
    try {
      const response = await api.get(`/support-tickets/${ticket.id}`);
      setSelectedTicket(response?.data?.data || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to open this support request.");
    }
  }

  async function submitTicket(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (attachmentFile) payload.append("attachment", attachmentFile);
      const response = await api.post("/support-tickets", payload);
      setMessage(response?.data?.message || "Support request submitted.");
      setForm(initialForm);
      setAttachmentFile(null);
      setShowRequestForm(false);
      await loadTickets();
      if (response?.data?.data) setSelectedTicket(response.data.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit this support request.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReply(event) {
    event.preventDefault();
    if (!selectedTicket?.id || (!reply.trim() && !cannedReplyKey)) return;
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      if (reply.trim()) payload.append("body", reply.trim());
      if (cannedReplyKey) payload.append("canned_reply_key", cannedReplyKey);
      if (replyAttachment) payload.append("attachment", replyAttachment);
      const response = await api.post(`/support-tickets/${selectedTicket.id}/replies`, payload);
      setSelectedTicket(response?.data?.data || selectedTicket);
      setReply("");
      setReplyAttachment(null);
      setCannedReplyKey("");
      setMessage(response?.data?.message || "Reply added.");
      await loadTickets(pagination?.current_page || 1);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to add your reply.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadAttachment(messageId, filename = "support-attachment") {
    try {
      const linkResponse = await api.get(`/support-ticket-messages/${messageId}/attachment-url`);
      const signedUrl = linkResponse.data?.data?.url;
      if (!signedUrl) throw new Error("The server did not provide a signed attachment link.");
      const response = await api.get(signedUrl, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError?.response?.data?.message || requestError?.message || "Unable to download this attachment."); }
  }

  async function updateTicketStatus(nextStatus) {
    if (!selectedTicket?.id || !isPlatformAdmin) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.patch(`/support-tickets/${selectedTicket.id}/status`, { status: nextStatus });
      setSelectedTicket(response?.data?.data || selectedTicket);
      setMessage(response?.data?.message || "Support ticket updated.");
      await loadTickets(pagination?.current_page || 1);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update the support ticket.");
    } finally {
      setSaving(false);
    }
  }

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter((article) => `${article.title} ${article.category} ${article.purpose} ${article.definition || ""} ${article.primaryPurpose || ""} ${article.worksWith || ""} ${article.firstChecks || ""} ${(article.canDo || []).join(" ")} ${(article.cannotDo || []).join(" ")} ${(article.dailyWorkflow || []).join(" ")} ${article.audience || ""} ${article.whyItMatters || ""} ${article.beforeYouStart || ""} ${article.next} ${(article.steps || []).map((step) => `${step.title} ${step.detail}`).join(" ")} ${(article.fields || []).map((field) => `${field.name} ${field.explanation}`).join(" ")} ${(article.controls || []).join(" ")}`.toLowerCase().includes(query));
  }, [articles, search]);

  const columns = [
    { key: "ticket_number", label: "Reference", render: (ticket) => <button type="button" className="font-semibold text-indigo-700 underline" onClick={() => openTicket(ticket)}>{ticket.ticket_number}</button> },
    { key: "subject", label: "Request", render: (ticket) => <button type="button" className="text-left font-semibold text-slate-900" onClick={() => openTicket(ticket)}>{ticket.subject}</button> },
    { key: "category", label: "Category", render: (ticket) => categoryLabels[ticket.category] || ticket.category },
    { key: "priority", label: "Priority", render: (ticket) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${ticket.priority === "urgent" ? "bg-rose-100 text-rose-700" : ticket.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{ticket.priority}</span> },
    { key: "status", label: "Status", render: (ticket) => statusLabels[ticket.status] || ticket.status },
    { key: "updated_at", label: "Updated", render: (ticket) => formatDate(ticket.updated_at) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Support Centre" subtitle="Find a clear answer, follow the correct workflow, or send a support request that can be tracked from start to finish." action={<button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowRequestForm((open) => !open)}>{showRequestForm ? "Close request form" : "Ask for support"}</button>} />

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}<button type="button" onClick={() => loadTickets()} className="ml-2 font-semibold underline">Retry</button></div>}
      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Start here</p>
        <h2 className="mt-1 text-xl font-bold text-indigo-950">You are using DOONO as {roleHelp.label}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-900">{roleHelp.intro}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(Array.isArray(roleHelp.steps) ? roleHelp.steps.slice(0, 3) : []).map((step, index) => <button key={`${step.title}-${index}`} type="button" onClick={() => setSearch(step.title)} className="rounded-lg border border-indigo-200 bg-white p-4 text-left shadow-sm"><span className="text-xs font-bold text-indigo-600">Step {index + 1}</span><span className="mt-1 block font-semibold text-slate-900">{step.title}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{step.detail}</span></button>)}
        </div>
      </section>

      <section className="rounded-xl border border-violet-100 bg-violet-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Learn the language of DOONO</p><h2 className="mt-1 text-xl font-bold text-violet-950">Understand the important terms before you begin</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-violet-900">If you are new to school-management software, open a concept below. Each explanation tells you what the term means, gives a practical example, and explains why it matters to your work.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{CONCEPT_GUIDES.map((concept) => <details key={concept.key} className="rounded-lg border border-violet-200 bg-white p-4"><summary className="cursor-pointer font-semibold text-slate-900">{concept.title}</summary><p className="mt-3 text-sm leading-6 text-slate-700"><strong>Meaning:</strong> {concept.meaning}</p><p className="mt-2 text-sm leading-6 text-slate-700"><strong>Example:</strong> {concept.example}</p><p className="mt-2 text-sm leading-6 text-slate-700"><strong>Why it matters:</strong> {concept.why}</p><p className="mt-2 text-xs text-slate-500"><strong>Related:</strong> {concept.related.join(", ")}</p></details>)}</div></section>

      {showRequestForm && <form onSubmit={submitTicket} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-lg font-bold text-slate-900">Create a support request</h2><p className="mt-1 text-sm text-slate-500">Describe what you expected, what happened, and where it happened. Never include a password or payment-card number.</p></div><div className="grid gap-4 md:grid-cols-3"><label className="block text-sm font-semibold text-slate-700 md:col-span-2">Subject<input required maxLength={180} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Example: I cannot publish the term result" /></label><label className="block text-sm font-semibold text-slate-700">Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label className="block text-sm font-semibold text-slate-700">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Explain the problem<textarea required minLength={10} maxLength={10000} rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Tell us the steps you took, the error message, and the school/module involved." /></label><label className="block text-sm font-semibold text-slate-700">Attachment <input type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /><span className="mt-1 block text-xs font-normal text-slate-500">Optional, maximum 10 MB. Never upload passwords or payment-card details.</span></label><div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit support request"}</button><button type="button" onClick={() => setShowRequestForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button></div></form>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end gap-3"><label className="min-w-[220px] flex-1 text-sm font-semibold text-slate-700">Search help and requests<input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loadTickets(); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Search fees, login, results, timetable..." /></label><label className="text-sm font-semibold text-slate-700">Request status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={() => loadTickets()} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Search</button></div></section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Searchable help</h2><p className="mt-1 text-sm text-slate-500">Select an explanation below. It tells you what the workspace is for, what to do first, and what should happen next.</p>{filteredArticles.length === 0 ? <EmptyState title="No matching guide found" message="Try a simpler word, or submit a support request if the explanation you need is missing." /> : <div className="mt-4 grid gap-3 md:grid-cols-2">{filteredArticles.map((article) => <details key={article.id} className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer font-semibold text-slate-900">{article.title}<span className="ml-2 text-xs font-normal text-slate-500">{article.category}</span></summary><p className="mt-3 text-sm leading-6 text-slate-600">{article.purpose}</p>{article.definition && <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm leading-6 text-indigo-950"><strong>What this role means:</strong> {article.definition}<br /><strong>Its main purpose:</strong> {article.primaryPurpose}<br /><strong>Works with:</strong> {article.worksWith}<br /><strong>Before you start:</strong> {article.firstChecks}</div>}{Array.isArray(article.canDo) && article.canDo.length > 0 && <div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><h3 className="text-sm font-bold text-emerald-900">This role can do</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950">{article.canDo.map((item) => <li key={`${article.id}-can-${item}`}>{item}</li>)}</ul></div><div className="rounded-lg border border-rose-100 bg-rose-50 p-3"><h3 className="text-sm font-bold text-rose-900">This role must not do</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-rose-950">{article.cannotDo.map((item) => <li key={`${article.id}-cannot-${item}`}>{item}</li>)}</ul></div></div>}{Array.isArray(article.dailyWorkflow) && article.dailyWorkflow.length > 0 && <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-3"><h3 className="text-sm font-bold text-violet-900">Normal working cycle</h3><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-violet-950">{article.dailyWorkflow.map((item) => <li key={`${article.id}-workflow-${item}`}>{item}</li>)}</ol></div>}{article.audience && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>Who this is for:</strong> {article.audience}</p>}{article.whyItMatters && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>Why it matters:</strong> {article.whyItMatters}</p>}{article.beforeYouStart && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>Prepare first:</strong> {article.beforeYouStart}</p>}{Array.isArray(article.fields) && article.fields.length > 0 && <div className="mt-3 rounded-lg bg-indigo-50 p-3"><h3 className="text-sm font-bold text-indigo-900">Important fields</h3><div className="mt-2 space-y-2">{article.fields.map((field) => <div key={`${article.id}-${field.name}`} className="text-sm leading-6 text-indigo-950"><strong>{field.name}:</strong> {field.explanation}</div>)}</div></div>}{Array.isArray(article.controls) && article.controls.length > 0 && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><h3 className="text-sm font-bold text-slate-800">How to use the controls</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{article.controls.map((control) => <li key={`${article.id}-${control}`}>{control}</li>)}</ul></div>}<ol className="mt-3 space-y-2">{(Array.isArray(article.steps) ? article.steps : []).map((step, index) => <li key={`${article.id}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-700"><span className="font-bold text-indigo-600">{index + 1}.</span><span><strong>{step?.title || "Do this"}</strong>{step?.detail ? ` — ${step.detail}` : ""}</span></li>)}</ol><p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><strong>Next:</strong> {article.next}</p>{Array.isArray(article.successSignals) && article.successSignals.length > 0 && <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><h3 className="text-sm font-bold text-emerald-900">How you know it worked</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950">{article.successSignals.map((signal) => <li key={`${article.id}-${signal}`}>{signal}</li>)}</ul></div>}{Array.isArray(article.commonMistakes) && <div className="mt-3"><h3 className="text-sm font-bold text-slate-800">Common mistakes to avoid</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{article.commonMistakes.map((mistake, index) => <li key={`${article.id}-mistake-${index}`}>{mistake}</li>)}</ul></div>}{Array.isArray(article.faqs) && <div className="mt-3"><h3 className="text-sm font-bold text-slate-800">Frequently asked questions</h3><div className="mt-2 space-y-2">{article.faqs.map((faq, index) => <div key={`${article.id}-faq-${index}`} className="rounded-lg border border-slate-200 p-3 text-sm"><strong className="text-slate-800">{faq.question}</strong><p className="mt-1 leading-6 text-slate-600">{faq.answer}</p></div>)}</div></div>}</details>)}</div>}</section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">My support requests</h2><p className="mt-1 text-sm text-slate-500">Every request receives a reference number. Use it when contacting the DOONO team outside the software.</p><div className="mt-4"><DataTable columns={columns} data={tickets} loading={loading} emptyTitle="No support requests yet" emptyMessage="If the guide does not answer your question, select Ask for support above." rowKey={(ticket) => ticket.id} pagination={pagination} onPageChange={loadTickets} /></div></section>

      {selectedTicket && <section className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{selectedTicket.ticket_number}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selectedTicket.subject}</h2><p className="mt-1 text-sm text-slate-500">{categoryLabels[selectedTicket.category] || selectedTicket.category} · {selectedTicket.priority} priority · {statusLabels[selectedTicket.status] || selectedTicket.status}</p>{selectedTicket.resolution_due_at && <p className={`mt-2 text-xs font-semibold ${selectedTicket.sla_breached_at ? "text-rose-700" : "text-amber-700"}`}>{selectedTicket.sla_breached_at ? `SLA breached ${formatDate(selectedTicket.sla_breached_at)}` : `Resolution target ${formatDate(selectedTicket.resolution_due_at)}`}</p>}</div><button type="button" onClick={() => setSelectedTicket(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Close</button></div><div className="mt-4 space-y-3">{(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []).map((item) => <article key={item.id} className={`rounded-lg p-4 ${item.is_internal_note ? "bg-amber-50" : "bg-slate-50"}`}><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">{item.user?.name || "DOONO Support"}{item.is_internal_note ? " · Internal note" : ""}</span><span>{formatDate(item.created_at)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>{item.attachment_available && <button type="button" onClick={() => downloadAttachment(item.id, item.original_filename || "support-attachment")} className="mt-3 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700">Download attachment{item.original_filename ? ` · ${item.original_filename}` : ""}</button>}</article>)}</div><form onSubmit={submitReply} className="mt-4 flex flex-col gap-3"><label className="text-sm font-semibold text-slate-700">Add a reply<textarea minLength={2} maxLength={10000} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Add information or answer the support team’s question." /></label><label className="block text-sm font-semibold text-slate-700">Attachment <input type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" onChange={(event) => setReplyAttachment(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /></label>{isPlatformAdmin && <label className="block text-sm font-semibold text-slate-700">Canned reply<select value={cannedReplyKey} onChange={(event) => setCannedReplyKey(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="">Write a custom reply</option>{cannedReplies.map((item) => <option key={item.key} value={item.key}>{item.key.replaceAll("_", " ")}</option>)}</select></label>}<div className="flex flex-wrap gap-3"><button type="submit" disabled={saving || (!reply.trim() && !cannedReplyKey)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Sending…" : "Send reply"}</button>{isPlatformAdmin && <select disabled={saving} value={selectedTicket.status} onChange={(event) => updateTicketStatus(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</div></form></section>}

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><h2 className="font-bold">What support can and cannot do</h2><p className="mt-1">Support can explain workflows, investigate errors, review access problems, and track platform incidents. Support will never ask for your password, one-time code, or complete payment-card details. For urgent safety, safeguarding, or payment concerns, contact your school leadership or payment provider immediately as well as opening a support request.</p></section>
    </div>
  );
}
