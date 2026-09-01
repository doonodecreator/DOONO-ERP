import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

function display(value) { return value === null || value === undefined || value === "" ? "—" : value; }

export default function StudentProfile({ student, setPage }) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManageAdmissions = ["super_admin", "proprietor", "principal", "vice_principal_admin"].includes(roleSlug);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(student?.id));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!student?.id) { setLoading(false); return undefined; }
    setLoading(true);
    api.get(`/students/${student.id}/360`)
      .then((response) => { if (active) setProfile(response?.data?.data || null); })
      .catch((reason) => { if (active) setError(reason?.response?.data?.message || "Student profile could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [student?.id]);

  async function removeStudent() {
    if (!student?.id || !window.confirm("Are you sure you want to delete this student?")) return;
    try { await api.delete(`/students/${student.id}`); setPage("students"); }
    catch (reason) { setError(reason?.response?.data?.message || "Student could not be deleted."); }
  }

  if (!student) return <PageContainer><PageHeader title="Student Profile" subtitle="Select a student from the directory to view their complete school record." action={<Button variant="secondary" onClick={() => setPage("students")}>Back to students</Button>} /><EmptyState title="No student selected" message="Open a student from the Students Directory." /></PageContainer>;
  if (loading) return <PageContainer><PageHeader title="Student 360" subtitle="Loading the authorized student record..." /><LoadingSpinner text="Loading student profile..." /></PageContainer>;

  const record = profile?.student || student;
  const enrollments = Array.isArray(profile?.enrollments) ? profile.enrollments : [];
  const attendance = Array.isArray(profile?.attendance) ? profile.attendance : [];
  const results = Array.isArray(profile?.published_results) ? profile.published_results : [];
  const fees = Array.isArray(profile?.fees) ? profile.fees : [];
  const assignments = Array.isArray(profile?.recent_assignments) ? profile.recent_assignments : [];

  return <PageContainer>
    <PageHeader title="Student 360" subtitle="One authorized view of identity, enrollment history, attendance, published results, fees, and current assignments." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setPage("students")}>Back to students</Button>{canManageAdmissions && <><Button onClick={() => setPage("edit-student")}>Edit student</Button><Button variant="danger" onClick={removeStudent}>Delete</Button></>}</div>} />
    {error && <Alert variant="error">{error}</Alert>}
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-4">{(record.photo_url || record.photo) && <img src={record.photo_url || record.photo} alt={`${record.full_name || "Student"} profile`} className="h-20 w-20 rounded-full border-2 border-indigo-100 object-cover" />}<div><h2 className="text-xl font-bold text-slate-900">{display(record.full_name || [record.first_name, record.middle_name, record.last_name].filter(Boolean).join(" "))}</h2><p className="mt-1 text-sm text-slate-500">{display(record.admission_number)} · {display(record.class?.name || record.class_name)}{record.stream?.name ? ` · ${record.stream.name}` : ""}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{display(record.status)}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Gender</p><p className="mt-1 font-semibold text-slate-900">{display(record.gender)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Date of birth</p><p className="mt-1 font-semibold text-slate-900">{display(record.date_of_birth)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Nationality</p><p className="mt-1 font-semibold text-slate-900">{display(record.nationality)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Address</p><p className="mt-1 font-semibold text-slate-900">{display(record.address)}</p></div></div>{record.blood_group || record.genotype || record.medical_notes ? <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Restricted medical information</p><p className="mt-1">Blood group: {display(record.blood_group)} · Genotype: {display(record.genotype)}</p>{record.medical_notes && <p className="mt-1">Notes: {record.medical_notes}</p>}</div> : null}</section>
    <div className="grid gap-6 lg:grid-cols-2"><SectionCard title="Enrollment history" subtitle="School and class placement history.">{enrollments.length === 0 ? <EmptyState title="No enrollment history" message="No enrollment records are available for this student." /> : <div className="space-y-3">{enrollments.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold text-slate-900">{display(item.academic_session?.name)} · {display(item.term?.name)}</p><p className="text-sm text-slate-600">{display(item.class?.name)}{item.stream?.name ? ` · ${item.stream.name}` : ""} · {display(item.status)}</p></div>)}</div>}</SectionCard><SectionCard title="Attendance" subtitle="Recorded attendance for this student.">{attendance.length === 0 ? <EmptyState title="No attendance records" message="Attendance will appear after the school records a session." /> : <div className="grid gap-3 sm:grid-cols-2">{attendance.map((item) => <div key={item.status} className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">{display(item.status)}</p><p className="mt-1 text-2xl font-bold text-slate-900">{display(item.total)}</p></div>)}</div>}</SectionCard><SectionCard title="Published results" subtitle="Only officially published summaries are shown.">{results.length === 0 ? <EmptyState title="No published results" message="Approved results will appear here after publication." /> : <div className="space-y-3">{results.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-slate-900">{display(item.academic_session?.name)} · {display(item.term?.name)}</p><span className="text-sm font-bold text-indigo-700">Average {display(item.student_average)}</span></div><p className="mt-1 text-sm text-slate-600">Grade {display(item.overall_grade)} · Position {display(item.position)} · {display(item.promotion_status)}</p></div>)}</div>}</SectionCard><SectionCard title="Fees and balances" subtitle="Recent fee records for the student’s school enrollment.">{fees.length === 0 ? <EmptyState title="No fee records" message="No fee record is available for this student." /> : <div className="space-y-3">{fees.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold text-slate-900">{display(item.category)}</p><p className="text-sm text-slate-600">Due {display(item.amount_due)} · Paid {display(item.total_paid)} · Balance {display(item.balance)}</p></div>)}</div>}</SectionCard><SectionCard title="Recent assignments" subtitle="Published work targeted to the student’s current class and stream.">{assignments.length === 0 ? <EmptyState title="No current assignments" message="Published assignments will appear here when the class receives them." /> : <div className="space-y-3">{assignments.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold text-slate-900">{display(item.title)}</p><p className="text-sm text-slate-600">Due {display(item.due_date)}</p></div>)}</div>}</SectionCard></div>
  </PageContainer>;
}
