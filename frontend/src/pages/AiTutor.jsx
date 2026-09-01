import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { paginatedFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

export default function AiTutor() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const studentMode = role === "student";
  const base = studentMode ? "/student/ai/conversations" : "/ai/conversations";
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => conversations.find((item) => Number(item.id) === Number(selectedId)), [conversations, selectedId]);

  const loadConversations = async () => {
    try {
      setLoading(true); setError("");
      const response = await api.get(base);
      setConfigured(response?.data?.configured === true);
      const { data } = paginatedFromResponse(response);
      setConversations(Array.isArray(data) ? data : []);
    } catch (reason) {
      setConversations([]); setError(reason?.message || "Unable to load the AI Tutor.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadConversations(); }, [base]);

  const openConversation = async (id) => {
    try {
      setError(""); setSelectedId(id);
      const response = await api.get(`${base}/${id}`);
      const payload = response?.data?.data;
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
    } catch (reason) { setMessages([]); setError(reason?.message || "Unable to open that AI conversation."); }
  };

  const send = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    try {
      setSending(true); setError("");
      const response = await api.post(base, { conversation_id: selectedId || undefined, message });
      const conversation = response?.data?.data?.conversation;
      if (conversation?.id) {
        setSelectedId(conversation.id);
        setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
        setConversations((current) => [conversation, ...current.filter((item) => Number(item.id) !== Number(conversation.id))]);
      }
      setDraft("");
    } catch (reason) { setError(reason?.message || "The AI Tutor could not respond."); }
    finally { setSending(false); }
  };

  return <PageContainer>
    <PageHeader title="DOONO AI Tutor" subtitle={studentMode ? "Ask questions, practise concepts, and receive age-appropriate study guidance." : "Use the school-safe AI assistant for educational planning and clearer explanations."} action={<Button variant="secondary" onClick={loadConversations} loading={loading}>Refresh</Button>} />
    {error && <Alert variant="error">{error}</Alert>}
    {!configured && <Alert variant="info">The AI Tutor is installed but not enabled for this deployment. A platform administrator must configure the server-side AI provider; no browser API key is required.</Alert>}
    {configured && <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
      <SectionCard title="Conversations" subtitle="Your private school-scoped history.">
        {loading ? <LoadingSpinner text="Loading conversations..." /> : conversations.length === 0 ? <EmptyState title="Start your first lesson" message="Ask the Tutor to explain a topic, create practice questions, or help you understand an assignment." /> : <div className="space-y-2">{conversations.map((item) => <button type="button" key={item.id} onClick={() => openConversation(item.id)} className={`w-full rounded-lg border p-3 text-left text-sm ${Number(selectedId) === Number(item.id) ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><span className="block font-semibold text-slate-900">{item.title || "Untitled lesson"}</span><span className="text-xs text-slate-500">{item.updated_at ? new Date(item.updated_at).toLocaleString() : "Recent"}</span></button>)}</div>}
      </SectionCard>
      <SectionCard title={selected?.title || "New learning conversation"} subtitle="AI answers are guidance, not an official grade or school decision.">
        <div className="min-h-[320px] space-y-3 rounded-xl bg-slate-50 p-4">{messages.length === 0 ? <EmptyState title="What would you like to learn?" message="Try: Explain photosynthesis simply, quiz me on fractions, or help me plan revision." /> : messages.map((item) => <div key={item.id} className={`max-w-[92%] rounded-xl p-3 text-sm ${item.role === "assistant" ? "bg-white text-slate-700 shadow-sm" : "ml-auto bg-indigo-600 text-white"}`}><p className="mb-1 text-[10px] font-bold uppercase opacity-60">{item.role === "assistant" ? "DOONO Tutor" : "You"}</p><p className="whitespace-pre-wrap">{item.content}</p></div>)}</div>
        <form onSubmit={send} className="mt-4 space-y-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={3} className="ui-input w-full" placeholder="Ask a learning question..." disabled={sending || !configured} /><div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Do not enter passwords, private records, or another student’s information.</span><Button type="submit" loading={sending} disabled={!configured || !draft.trim()}>Ask Tutor</Button></div></form>
      </SectionCard>
    </div>}
  </PageContainer>;
}
