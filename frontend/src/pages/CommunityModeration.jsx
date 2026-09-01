import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

function rows(payload, key) {
  const value = payload?.[key];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function CommunityModeration() {
  const [payload, setPayload] = useState({ posts: [], comments: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try { setLoading(true); setError(""); const response = await api.get("/community/moderation"); setPayload(response?.data && typeof response.data === "object" ? response.data : {}); }
    catch (reason) { setPayload({}); setError(reason?.message || "Unable to load the community moderation queue."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const moderate = async (type, id, status) => {
    try { setSaving(true); setError(""); await api.post(`/community/${type === "post" ? "posts" : "comments"}/${id}/moderate`, { status }); setMessage(`Community ${type} ${status}.`); await load(); }
    catch (reason) { setError(reason?.message || "The moderation action could not be saved."); }
    finally { setSaving(false); }
  };

  const posts = rows(payload, "posts");
  const comments = rows(payload, "comments");
  const reports = rows(payload, "reports");

  return <PageContainer><PageHeader title="Community Moderation" subtitle="Review student posts, comments, and reports in the active school." action={<Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>} />{error && <Alert variant="error">{error}</Alert>}{message && <Alert variant="success">{message}</Alert>}{loading ? <LoadingSpinner text="Loading moderation queue..." /> : <div className="space-y-5"><SectionCard title="Posts awaiting or under review" subtitle="Approve only content that is safe, respectful, and educational.">{posts.length === 0 ? <EmptyState title="No post records" message="New student submissions will appear here for review." /> : <div className="space-y-3">{posts.map((post) => <article key={post.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">Student #{post.author_student_id || "—"}</p><p className="text-xs text-slate-500">Status: {post.status}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => moderate("post", post.id, "approved")} loading={saving}>Approve</Button><Button size="sm" variant="secondary" onClick={() => moderate("post", post.id, "rejected")} loading={saving}>Reject</Button><Button size="sm" variant="danger" onClick={() => moderate("post", post.id, "taken_down")} loading={saving}>Take down</Button></div></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>{post.media_path && <p className="mt-2 text-xs font-semibold text-indigo-700">Video attached; it remains private until approval.</p>}</article>)}</div>}</SectionCard><SectionCard title="Comments" subtitle="Keep replies respectful and relevant to learning.">{comments.length === 0 ? <EmptyState title="No comment records" message="Student comments will appear here for review." /> : <div className="space-y-3">{comments.map((comment) => <article key={comment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">Student #{comment.author_student_id || "—"}</p><p className="text-xs text-slate-500">Status: {comment.status}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => moderate("comment", comment.id, "approved")} loading={saving}>Approve</Button><Button size="sm" variant="secondary" onClick={() => moderate("comment", comment.id, "rejected")} loading={saving}>Reject</Button></div></div><p className="mt-3 text-sm text-slate-700">{comment.body}</p></article>)}</div>}</SectionCard><SectionCard title="Pending reports" subtitle="Reports should be handled promptly and with safeguarding judgement.">{reports.length === 0 ? <EmptyState title="No pending reports" message="Student reports will appear here when submitted." /> : <div className="space-y-2">{reports.map((report) => <div key={report.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-semibold text-amber-900">{report.reason}</p><p className="text-amber-800">Target: {report.target_type} #{report.target_id}</p><p className="mt-1 text-amber-700">{report.details || "No additional details provided."}</p></div>)}</div>}</SectionCard></div>}</PageContainer>;
}
