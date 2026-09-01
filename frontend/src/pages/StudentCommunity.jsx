import { useEffect, useState } from "react";
import api from "../services/api";
import { paginatedFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

function CommunityVideo({ postId }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get(`/student/community/posts/${postId}/video-url`).then((response) => { if (active) setUrl(response?.data?.data?.url || ""); }).catch((reason) => { if (active) setError(reason?.message || "Video unavailable."); });
    return () => { active = false; };
  }, [postId]);
  if (error) return <p className="mt-3 text-xs text-rose-700">{error}</p>;
  if (!url) return <p className="mt-3 text-xs text-slate-500">Preparing approved video...</p>;
  return <video className="mt-3 max-h-80 w-full rounded-xl bg-black" controls preload="metadata" src={url}>Your browser cannot play this video.</video>;
}

export default function StudentCommunity() {
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState("");
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const response = await api.get("/student/community");
      const { data } = paginatedFromResponse(response);
      setPosts(Array.isArray(data) ? data : []);
    } catch (reason) { setPosts([]); setError(reason?.message || "Unable to load the student community."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submitPost = async (event) => {
    event.preventDefault();
    if (!body.trim() || saving) return;
    try {
      setSaving(true); setError("");
      const form = new FormData(); form.append("body", body.trim()); if (video) form.append("video", video);
      await api.post("/student/community/posts", form);
      setBody(""); setVideo(null); event.target.reset(); setMessage("Your post was submitted for school moderation.");
    } catch (reason) { setError(reason?.message || "Your post could not be submitted."); }
    finally { setSaving(false); }
  };

  const submitComment = async (postId) => {
    const text = String(comments[postId] || "").trim();
    if (!text || saving) return;
    try { setSaving(true); setError(""); await api.post(`/student/community/posts/${postId}/comments`, { body: text }); setComments((current) => ({ ...current, [postId]: "" })); setMessage("Your comment was submitted for moderation."); }
    catch (reason) { setError(reason?.message || "Your comment could not be submitted."); }
    finally { setSaving(false); }
  };

  const report = async (targetType, targetId) => {
    try { setError(""); await api.post("/student/community/reports", { target_type: targetType, target_id: targetId, reason: "other" }); setMessage("The report was sent to your school moderation team."); }
    catch (reason) { setError(reason?.message || "The report could not be submitted."); }
  };

  return <PageContainer>
    <PageHeader title="Student Community" subtitle="Learn with classmates through school-moderated posts and approved project videos." action={<Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>} />
    {error && <Alert variant="error">{error}</Alert>}
    {message && <Alert variant="success" action={<Button size="sm" variant="secondary" onClick={() => setMessage("")}>Dismiss</Button>}>{message}</Alert>}
    <Alert variant="info">This is a protected school space. Posts and comments are reviewed before they appear. Do not share phone numbers, passwords, home addresses, or private information. Live rooms and international exchange will appear only after school, guardian, and provider safeguards are configured.</Alert>
    <SectionCard title="Share something useful" subtitle="Start a study discussion, explain a concept, or submit an approved learning video.">
      <form onSubmit={submitPost} className="space-y-3"><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={5000} className="ui-input w-full" placeholder="Write a respectful learning post..." /><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="text-sm font-semibold text-slate-700">Optional video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideo(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /></label><Button type="submit" loading={saving} disabled={!body.trim()}>Submit for review</Button></div><p className="text-xs text-slate-500">Videos are private until approved and require guardian consent configured by the school. Maximum upload size is 100 MB.</p></form>
    </SectionCard>
    <div className="mt-5 space-y-4">{loading ? <LoadingSpinner text="Loading approved community posts..." /> : posts.length === 0 ? <EmptyState title="No approved posts yet" message="Be the first to submit a helpful learning post. It will appear here after school moderation." /> : posts.map((post) => <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">Student #{post.author_student_id || "—"}</p><p className="text-xs text-slate-500">{post.published_at ? new Date(post.published_at).toLocaleString() : "Recently approved"}</p></div><Button size="sm" variant="secondary" onClick={() => report("post", post.id)}>Report</Button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>{post.media_path && <CommunityVideo postId={post.id} />}<div className="mt-4 space-y-2 border-t border-slate-100 pt-4">{Array.isArray(post.comments) && post.comments.map((comment) => <div key={comment.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">Student #{comment.author_student_id || "—"}</p><p className="mt-1 text-slate-600">{comment.body}</p><button type="button" onClick={() => report("comment", comment.id)} className="mt-2 text-xs font-semibold text-rose-600 underline">Report comment</button></div>)}<div className="flex flex-col gap-2 sm:flex-row"><input value={comments[post.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [post.id]: event.target.value }))} maxLength={2000} className="ui-input flex-1" placeholder="Add a respectful comment..." /><Button size="sm" onClick={() => submitComment(post.id)} loading={saving} disabled={!String(comments[post.id] || "").trim()}>Comment</Button></div></div></article>)}</div>
  </PageContainer>;
}
