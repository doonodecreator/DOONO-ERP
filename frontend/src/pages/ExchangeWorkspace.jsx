import { useEffect, useState } from "react";
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

const initialForm = { title: "", description: "", subject: "", age_band: "", country_focus: "", allow_international: false, starts_at: "", ends_at: "" };

function listValue(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function ExchangeWorkspace() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const studentMode = role === "student";
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState({});
  const [settings, setSettings] = useState({ enabled: false, international_enabled: false, safeguarding_note: "" });
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      if (studentMode) {
        const response = await api.get("/student/exchange");
        const { data } = paginatedFromResponse(response);
        setProjects(Array.isArray(data) ? data : []);
        return;
      }
      const [settingResponse, moderationResponse, schoolsResponse] = await Promise.all([
        api.get("/exchange/settings"),
        api.get("/exchange/moderation"),
        api.get("/exchange/schools"),
      ]);
      const setting = settingResponse?.data?.data;
      setSettings(setting && typeof setting === "object" ? setting : { enabled: false, international_enabled: false, safeguarding_note: "" });
      const payload = moderationResponse?.data?.data || {};
      setProjects(listValue(payload.projects));
      setInvitations(listValue(payload.invitations));
      setSchools(listValue(schoolsResponse?.data?.data));
    } catch (reason) {
      setProjects([]);
      setInvitations([]);
      setSchools([]);
      setError(reason?.message || "Unable to load exchange workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [studentMode]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const join = async (projectId) => {
    try { setSaving(true); setError(""); await api.post(`/student/exchange/projects/${projectId}/join`); setMessage("Your request was sent to the school for approval."); }
    catch (reason) { setError(reason?.message || "Unable to request participation."); }
    finally { setSaving(false); }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try { setSaving(true); setError(""); await api.put("/exchange/settings", settings); setMessage("School exchange settings saved."); }
    catch (reason) { setError(reason?.message || "Unable to save exchange settings."); }
    finally { setSaving(false); }
  };

  const submitProject = async (event) => {
    event.preventDefault();
    try { setSaving(true); setError(""); await api.post("/exchange/projects", form); setForm(initialForm); setMessage("Project submitted for school approval."); await load(); }
    catch (reason) { setError(reason?.message || "Unable to submit project."); }
    finally { setSaving(false); }
  };

  const approveProject = async (id) => {
    try { setSaving(true); setError(""); await api.post(`/exchange/projects/${id}/approve`); setMessage("Project published for participating schools."); await load(); }
    catch (reason) { setError(reason?.message || "Unable to approve project."); }
    finally { setSaving(false); }
  };

  const inviteSchool = async (projectId) => {
    const schoolId = selectedSchool[projectId];
    if (!schoolId) return;
    try { setSaving(true); setError(""); await api.post(`/exchange/projects/${projectId}/invite-school`, { school_id: Number(schoolId) }); setMessage("Partner school invitation sent."); setSelectedSchool((current) => ({ ...current, [projectId]: "" })); await load(); }
    catch (reason) { setError(reason?.message || "Unable to invite that school."); }
    finally { setSaving(false); }
  };

  const respondInvite = async (id, status) => {
    try { setSaving(true); setError(""); await api.post(`/exchange/project-schools/${id}/respond`, { status }); setMessage(`Invitation ${status}.`); await load(); }
    catch (reason) { setError(reason?.message || "Unable to update invitation."); }
    finally { setSaving(false); }
  };

  const studentView = (
    <>
      <Alert variant="info">This is curated collaboration, not unrestricted social media. Your real name and contact details are not shared through exchange records. International projects require school opt-in and guardian consent.</Alert>
      {loading ? <LoadingSpinner text="Loading approved projects..." /> : projects.length === 0 ? <EmptyState title="No projects available" message="Your school will show approved exchange projects here when a participating school has opened one." /> : <div className="space-y-4">{projects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-bold text-slate-900">{project.title}</h2><p className="mt-1 text-sm text-slate-500">{project.subject || "General learning"} · {project.age_band || "Age group set by school"}{project.allow_international ? " · International" : " · School exchange"}</p></div><Button size="sm" onClick={() => join(project.id)} loading={saving}>Request to join</Button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{project.description}</p><p className="mt-3 text-xs text-slate-500">Hosted by {project.school?.name || "an approved school"}. Participation is subject to school approval.</p></article>)}</div>}
    </>
  );

  const adminView = (
    <div className="space-y-5">
      <SectionCard title="School opt-in" subtitle="Exchange stays disabled until the school explicitly enables it."><form onSubmit={saveSettings} className="space-y-4"><label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(settings.enabled)} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} /> Enable curated project exchange</label><label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(settings.international_enabled)} onChange={(event) => setSettings((current) => ({ ...current, international_enabled: event.target.checked }))} /> Enable international exchange after safeguarding review</label><textarea value={settings.safeguarding_note || ""} onChange={(event) => setSettings((current) => ({ ...current, safeguarding_note: event.target.value }))} rows={3} maxLength={2000} className="ui-input w-full" placeholder="Safeguarding instructions or school policy note" /><Button type="submit" loading={saving}>Save opt-in settings</Button></form></SectionCard>
      <SectionCard title="Submit a project" subtitle="A moderator must approve the project before any participating school can see it."><form onSubmit={submitProject} className="grid gap-3 md:grid-cols-2"><input required maxLength={180} value={form.title} onChange={(event) => updateForm("title", event.target.value)} className="ui-input md:col-span-2" placeholder="Project title" /><textarea required maxLength={10000} rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="ui-input md:col-span-2" placeholder="What will learners study or create?" /><input maxLength={120} value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} className="ui-input" placeholder="Subject" /><input maxLength={80} value={form.age_band} onChange={(event) => updateForm("age_band", event.target.value)} className="ui-input" placeholder="Age band" /><input maxLength={120} value={form.country_focus} onChange={(event) => updateForm("country_focus", event.target.value)} className="ui-input" placeholder="Country or region focus (optional)" /><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(form.allow_international)} onChange={(event) => updateForm("allow_international", event.target.checked)} /> International project</label><Button type="submit" loading={saving} disabled={!settings.enabled}>Submit project for approval</Button></form></SectionCard>
      <SectionCard title="Projects and invitations" subtitle="Review exchange records for this school context.">{loading ? <LoadingSpinner text="Loading exchange records..." /> : projects.length === 0 && invitations.length === 0 ? <EmptyState title="No exchange records" message="Submitted projects and school invitations will appear here." /> : <div className="space-y-4">{projects.map((project) => <div key={project.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">{project.title}</p><p className="text-xs text-slate-500">Status: {project.status}</p></div>{project.status === "pending_review" && <Button size="sm" onClick={() => approveProject(project.id)} loading={saving}>Approve and publish</Button>}</div>{project.status === "published" && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={selectedSchool[project.id] || ""} onChange={(event) => setSelectedSchool((current) => ({ ...current, [project.id]: event.target.value }))} className="ui-input"><option value="">Select an opted-in school</option>{schools.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}{partner.country?.name ? ` · ${partner.country.name}` : ""}</option>)}</select><Button size="sm" onClick={() => inviteSchool(project.id)} loading={saving} disabled={!selectedSchool[project.id]}>Invite school</Button></div>}</div>)}{invitations.map((invite) => <div key={invite.id} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="font-semibold text-indigo-900">Invitation from {invite.project?.school?.name || "approved school"}</p><p className="mt-1 text-sm text-indigo-800">{invite.project?.title || "Exchange project"}</p>{invite.status === "invited" && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => respondInvite(invite.id, "accepted")} loading={saving}>Accept</Button><Button size="sm" variant="secondary" onClick={() => respondInvite(invite.id, "rejected")} loading={saving}>Decline</Button></div>}</div>)}</div>}</SectionCard>
    </div>
  );

  return <PageContainer><PageHeader title={studentMode ? "Project Exchange" : "Exchange Administration"} subtitle={studentMode ? "Join school-approved projects using a protected learner alias." : "Opt your school in, submit supervised projects, and review school invitations."} action={<Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>} />{error && <Alert variant="error">{error}</Alert>}{message && <Alert variant="success">{message}</Alert>}{studentMode ? studentView : adminView}</PageContainer>;
}
