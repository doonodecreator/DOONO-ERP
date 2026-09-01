import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { useAuth } from "../context/AuthContext";

const newVisit = () => ({ student_id: "", visit_date: new Date().toISOString().slice(0, 16), complaint: "", treatment_given: "", nurse_notes: "", referral_status: "none", referral_destination: "", follow_up_date: "", emergency_flag: false });
const newRecord = () => ({ student_id: "", blood_group: "", genotype: "", allergies: "", chronic_conditions: "", emergency_contact_name: "", emergency_contact_phone: "" });

export default function NurseDashboard() {
  const { permissions = [] } = useAuth();
  const canViewSensitiveHealth = Array.isArray(permissions) && permissions.includes("view_sensitive_health");
  const [activeTab, setActiveTab] = useState("visits");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visits, setVisits] = useState([]);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState(null);
  const [visitForm, setVisitForm] = useState(newVisit());
  const [recordForm, setRecordForm] = useState(newRecord());

  const loadClinicData = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const [visitsResponse, recordsResponse, studentsResponse] = await Promise.all([
        api.get("/clinic-visits"), api.get("/medical-records"), api.get("/students"),
      ]);
      setVisits(arrayFromResponse(visitsResponse));
      setRecords(arrayFromResponse(recordsResponse));
      setStudents(arrayFromResponse(studentsResponse));
    } catch (reason) {
      setError(reason?.response?.data?.message || "The school health workspace could not be loaded.");
      setVisits([]); setRecords([]); setStudents([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadClinicData(); }, [loadClinicData]);

  async function saveVisit(event) {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await api.post("/clinic-visits", { ...visitForm, emergency_flag: Boolean(visitForm.emergency_flag) });
      setMessage("Clinic visit recorded successfully."); setVisitForm(newVisit()); setModal(null); await loadClinicData();
    } catch (reason) { setError(reason?.response?.data?.message || "The clinic visit could not be saved."); }
    finally { setSaving(false); }
  }

  async function saveRecord(event) {
    event.preventDefault();
    try {
      setSaving(true); setError(""); await api.post("/medical-records", recordForm);
      setMessage("Student medical profile saved successfully."); setRecordForm(newRecord()); setModal(null); await loadClinicData();
    } catch (reason) { setError(reason?.response?.data?.message || "The medical profile could not be saved."); }
    finally { setSaving(false); }
  }

  const studentName = (student) => student?.full_name || [student?.surname, student?.first_name, student?.last_name].filter(Boolean).join(" ") || `Student #${student?.id || "—"}`;
  const visitColumns = [
    { key: "student", label: "Student", render: (visit) => <><strong>{studentName(visit.student)}</strong><small>{visit.student?.admission_number || ""}</small></> },
    { key: "complaint", label: "Complaint", render: (visit) => canViewSensitiveHealth ? (visit.complaint || "—") : "Restricted clinical detail" },
    { key: "treatment_given", label: "Treatment", render: (visit) => canViewSensitiveHealth ? (visit.treatment_given || "—") : "Restricted clinical detail" },
    { key: "visit_date", label: "Visit", render: (visit) => visit.visit_date || "—" },
    { key: "status", label: "Safety", render: (visit) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${visit.emergency_flag ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{visit.emergency_flag ? "Emergency" : visit.referral_status && visit.referral_status !== "none" ? `Referral: ${visit.referral_status}` : "Routine"}</span> },
  ];
  const recordColumns = [
    { key: "student", label: "Student", render: (record) => <><strong>{studentName(record.student)}</strong><small>{record.student?.admission_number || ""}</small></> },
    { key: "blood_group", label: "Blood group", render: (record) => canViewSensitiveHealth ? (record.blood_group || "Not recorded") : "Restricted" },
    { key: "genotype", label: "Genotype", render: (record) => canViewSensitiveHealth ? (record.genotype || "Not recorded") : "Restricted" },
    { key: "health", label: "Known risks", render: (record) => <span>{canViewSensitiveHealth ? (record.allergies || record.chronic_conditions ? "Review profile" : "None recorded") : (record.has_allergies || record.has_chronic_conditions ? "Review restricted profile" : "None recorded")}</span> },
    { key: "emergency", label: "Emergency contact", render: (record) => canViewSensitiveHealth ? (record.emergency_contact_name || "Not recorded") : (record.has_emergency_contact ? "Present — restricted" : "Not recorded") },
  ];

  return <PageContainer>
    <PageHeader title="School Clinic & Health" subtitle="Protect student health information, record visits, and track emergency or referral follow-up." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={loadClinicData} loading={loading}>Refresh</Button>{canViewSensitiveHealth && <><Button variant="secondary" onClick={() => setModal("record")}>Add medical profile</Button><Button onClick={() => setModal("visit")}>Log clinic visit</Button></>}</div>} />
    {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={loadClinicData}>Retry</Button>}>{error}</Alert>}
    {message && <Alert variant="success" action={<Button variant="secondary" size="sm" onClick={() => setMessage("")}>Dismiss</Button>}>{message}</Alert>}
    <DashboardGrid><StatCard title="Clinic visits" value={visits.length} color="primary" /><StatCard title="Medical profiles" value={records.length} color="info" /><StatCard title="Emergency flags" value={visits.filter((visit) => visit.emergency_flag).length} color="warning" /><StatCard title="Open referrals" value={visits.filter((visit) => ["pending"].includes(visit.referral_status)).length} color="success" /></DashboardGrid>
    <div className="my-5 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><Button variant={activeTab === "visits" ? "primary" : "secondary"} onClick={() => setActiveTab("visits")}>Clinic visits ({visits.length})</Button><Button variant={activeTab === "records" ? "primary" : "secondary"} onClick={() => setActiveTab("records")}>Medical profiles ({records.length})</Button></div>
    {loading ? <LoadingSpinner text="Loading health records..." /> : <SectionCard title={activeTab === "visits" ? "Visit history" : "Student medical profiles"} subtitle="Health data is visible only inside the authorized school clinic workflow and access is audited."><DataTable columns={activeTab === "visits" ? visitColumns : recordColumns} data={activeTab === "visits" ? visits : records} emptyTitle={activeTab === "visits" ? "No clinic visits" : "No medical profiles"} emptyMessage={activeTab === "visits" ? "Record the first clinic visit when a learner is attended to." : "Create a profile for emergency and allergy information."} /></SectionCard>}

    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-900">{modal === "visit" ? "Log clinic visit" : "Add medical profile"}</h2><p className="mt-1 text-sm text-slate-600">Use only the minimum necessary information and confirm the learner belongs to this school.</p></div><button type="button" onClick={() => setModal(null)} className="text-2xl text-slate-500" aria-label="Close">×</button></div>{modal === "visit" ? <form onSubmit={saveVisit} className="space-y-4"><label className="block text-sm font-semibold">Student<select required value={visitForm.student_id} onChange={(event) => setVisitForm({ ...visitForm, student_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select active student</option>{students.map((student) => <option key={student.id} value={student.id}>{studentName(student)} — {student.admission_number || "No admission number"}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Visit date and time<input required type="datetime-local" value={visitForm.visit_date} onChange={(event) => setVisitForm({ ...visitForm, visit_date: event.target.value })} className="ui-input mt-1 w-full" /></label><label className="block text-sm font-semibold">Complaint<input required value={visitForm.complaint} onChange={(event) => setVisitForm({ ...visitForm, complaint: event.target.value })} className="ui-input mt-1 w-full" placeholder="Symptoms or reason for visit" /></label></div><label className="block text-sm font-semibold">Treatment given<textarea required value={visitForm.treatment_given} onChange={(event) => setVisitForm({ ...visitForm, treatment_given: event.target.value })} className="ui-input mt-1 min-h-24 w-full" /></label><label className="block text-sm font-semibold">Nurse notes<textarea value={visitForm.nurse_notes} onChange={(event) => setVisitForm({ ...visitForm, nurse_notes: event.target.value })} className="ui-input mt-1 min-h-20 w-full" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Referral status<select value={visitForm.referral_status} onChange={(event) => setVisitForm({ ...visitForm, referral_status: event.target.value })} className="ui-input mt-1 w-full"><option value="none">No referral</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="declined">Declined</option></select></label><label className="block text-sm font-semibold">Referral destination<input value={visitForm.referral_destination} onChange={(event) => setVisitForm({ ...visitForm, referral_destination: event.target.value })} className="ui-input mt-1 w-full" placeholder="Hospital, specialist, or service" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Follow-up date<input type="date" value={visitForm.follow_up_date} onChange={(event) => setVisitForm({ ...visitForm, follow_up_date: event.target.value })} className="ui-input mt-1 w-full" /></label><label className="flex items-center gap-3 pt-7 text-sm font-semibold"><input type="checkbox" checked={visitForm.emergency_flag} onChange={(event) => setVisitForm({ ...visitForm, emergency_flag: event.target.checked })} /> Emergency escalation required</label></div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>Save visit</Button></div></form> : <form onSubmit={saveRecord} className="space-y-4"><label className="block text-sm font-semibold">Student<select required value={recordForm.student_id} onChange={(event) => setRecordForm({ ...recordForm, student_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select active student</option>{students.map((student) => <option key={student.id} value={student.id}>{studentName(student)} — {student.admission_number || "No admission number"}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Blood group<select value={recordForm.blood_group} onChange={(event) => setRecordForm({ ...recordForm, blood_group: event.target.value })} className="ui-input mt-1 w-full"><option value="">Not recorded</option>{["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold">Genotype<select value={recordForm.genotype} onChange={(event) => setRecordForm({ ...recordForm, genotype: event.target.value })} className="ui-input mt-1 w-full"><option value="">Not recorded</option>{["AA", "AS", "SS", "AC"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="block text-sm font-semibold">Allergies<textarea value={recordForm.allergies} onChange={(event) => setRecordForm({ ...recordForm, allergies: event.target.value })} className="ui-input mt-1 min-h-20 w-full" /></label><label className="block text-sm font-semibold">Chronic conditions<textarea value={recordForm.chronic_conditions} onChange={(event) => setRecordForm({ ...recordForm, chronic_conditions: event.target.value })} className="ui-input mt-1 min-h-20 w-full" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Emergency contact<input value={recordForm.emergency_contact_name} onChange={(event) => setRecordForm({ ...recordForm, emergency_contact_name: event.target.value })} className="ui-input mt-1 w-full" /></label><label className="block text-sm font-semibold">Emergency phone<input value={recordForm.emergency_contact_phone} onChange={(event) => setRecordForm({ ...recordForm, emergency_contact_phone: event.target.value })} className="ui-input mt-1 w-full" /></label></div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>Save profile</Button></div></form>}</div></div>}
  </PageContainer>;
}
