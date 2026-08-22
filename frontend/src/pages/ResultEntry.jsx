import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const listFrom = (response) => arrayFromResponse(response);

export default function ResultEntry() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [structures, setStructures] = useState([]);
  const [gradingRules, setGradingRules] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [submissionId, setSubmissionId] = useState(null);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true); setError("");
        const response = role === "teacher" ? await api.get("/teacher/dashboard") : await api.get("/classes");
        if (role === "teacher") {
          const payload = response?.data;
          setClasses(Array.isArray(payload?.my_classes) ? payload.my_classes : []);
          setAssignedSubjects(Array.isArray(payload?.my_subjects) ? payload.my_subjects : []);
        } else {
          setClasses(listFrom(response));
          setAssignedSubjects([]);
        }
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Unable to load classes.");
      } finally { setLoading(false); }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
              setStudents([]); setSubjects([]); setSessions([]); setTerms([]); setStructures([]); setGradingRules([]); setSubmissionId(null);

      return;
    }
    async function loadRoster() {
      try {
        setLoadingRoster(true); setError(""); setMessage("");
        const response = await api.get("/result-entry/students", { params: { class_id: selectedClass } });
        const payload = response?.data || {};
        const subjectListFromApi = Array.isArray(payload.subjects) ? payload.subjects : [];
        const assignedSubjectIds = role === "teacher"
          ? assignedSubjects.filter((item) => String(item.class_id) === String(selectedClass)).map((item) => String(item.subject_id))
          : [];
        const subjectList = role === "teacher" && assignedSubjectIds.length > 0
          ? subjectListFromApi.filter((item) => assignedSubjectIds.includes(String(item.id)))
          : subjectListFromApi;
        const sessionList = Array.isArray(payload.sessions) ? payload.sessions : [];
        const termList = Array.isArray(payload.terms) ? payload.terms : [];
        const structureList = Array.isArray(payload.structures) ? payload.structures.filter((item) => item?.is_active !== false) : [];
        const gradingRuleList = Array.isArray(payload.grading_rules) ? payload.grading_rules : [];
        const enrollmentList = Array.isArray(payload.students) ? payload.students : [];
        setSubjects(subjectList); setSessions(sessionList); setTerms(termList); setStructures(structureList); setGradingRules(gradingRuleList); setStudents(enrollmentList); setSubmissionId(null);
        setSelectedSubject((current) => subjectList.some((item) => String(item.id) === String(current)) ? current : String(subjectList[0]?.id || ""));
        setSelectedSession((current) => sessionList.some((item) => String(item.id) === String(current)) ? current : String(sessionList[0]?.id || ""));
        setSelectedTerm((current) => termList.some((item) => String(item.id) === String(current)) ? current : String(termList[0]?.id || ""));
        const initialScores = {};
        enrollmentList.forEach((enrollment) => { initialScores[enrollment.id] = {}; structureList.forEach((structure) => { initialScores[enrollment.id][structure.id] = 0; }); });
        setScores(initialScores);
      } catch (requestError) {
        setStudents([]); setError(requestError?.response?.data?.message || "Unable to load the class result sheet.");
      } finally { setLoadingRoster(false); }
    }
    loadRoster();
  }, [selectedClass]);

  const selectedClassName = classes.find((item) => String(item.id) === String(selectedClass))?.name || "";
  const selectedSubjectName = subjects.find((item) => String(item.id) === String(selectedSubject))?.name || "";
  const totalMaximum = useMemo(() => structures.reduce((sum, structure) => sum + Number(structure.maximum_marks || 0), 0), [structures]);

  function updateScore(enrollmentId, structureId, value) {
    const structure = structures.find((item) => String(item.id) === String(structureId));
    const maximum = Number(structure?.maximum_marks || 100);
    const score = Math.max(0, Math.min(maximum, Number(value) || 0));
    setScores((current) => ({ ...current, [enrollmentId]: { ...(current[enrollmentId] || {}), [structureId]: score } }));
  }

  function totalFor(enrollmentId) {
    return structures.reduce((sum, structure) => sum + Number(scores[enrollmentId]?.[structure.id] || 0), 0);
  }

  function gradeFor(total) {
    const percentage = totalMaximum > 0 ? (total / totalMaximum) * 100 : 0;
    const matchingRule = gradingRules.find((rule) => percentage >= Number(rule.minimum_score) && percentage <= Number(rule.maximum_score));
    return matchingRule?.grade || "N/A";
  }

  async function saveScores(event) {
    event.preventDefault();
    if (!selectedClass || !selectedSubject || !selectedSession || !selectedTerm || !structures.length || !students.length) return;
    try {
      setSaving(true); setError(""); setMessage("");
      let activeSubmissionId = submissionId;
      if (!activeSubmissionId) {
        const submissionResponse = await api.post("/result-submissions", {
          class_id: Number(selectedClass),
          subject_id: Number(selectedSubject),
          academic_session_id: Number(selectedSession),
          term_id: Number(selectedTerm),
        });
        activeSubmissionId = submissionResponse?.data?.submission?.id || submissionResponse?.data?.data?.id;
        if (!activeSubmissionId) throw new Error("The result submission could not be created.");
        setSubmissionId(activeSubmissionId);
      }
      await api.post("/result-entry/save", {
        result_submission_id: Number(activeSubmissionId),
        subject_id: Number(selectedSubject),
        academic_session_id: Number(selectedSession),
        term_id: Number(selectedTerm),
        students: students.map((enrollment) => ({
          student_enrollment_id: enrollment.id,
          components: structures.map((structure) => ({ assessment_structure_id: structure.id, score: Number(scores[enrollment.id]?.[structure.id] || 0) })),
        })),
      });
      await api.post(`/result-submissions/${activeSubmissionId}/submit`);
      setMessage("Scores saved successfully and submitted for principal approval.");
    } catch (requestError) {
      const validation = requestError?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : requestError?.response?.data?.message || "Unable to save the result sheet.");
    } finally { setSaving(false); }
  }

  return <PageContainer>
    <PageHeader title="Class Result Entry" subtitle="Enter continuous assessment and examination components using the school’s configured assessment structure." action={<button type="button" onClick={saveScores} disabled={saving || !students.length || !structures.length} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save & Submit Scores"}</button>} />
    {message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {loading ? <LoadingSpinner text="Loading classes..." /> : <>
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="flex min-w-0 flex-col text-sm font-semibold text-slate-700">Class<select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex min-w-0 flex-col text-sm font-semibold text-slate-700">Subject<select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex min-w-0 flex-col text-sm font-semibold text-slate-700">Academic session<select value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"><option value="">Select session</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.name || item.session_year}</option>)}</select></label>
        <label className="flex min-w-0 flex-col text-sm font-semibold text-slate-700">Term<select value={selectedTerm} onChange={(event) => setSelectedTerm(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"><option value="">Select term</option>{terms.filter((item) => !selectedSession || String(item.academic_session_id) === String(selectedSession)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      {loadingRoster ? <LoadingSpinner text="Loading enrolled students and assessment structures..." /> : !selectedClass ? <EmptyState title="Select a class" message="Choose a class to open its real enrolled-student score sheet." /> : !structures.length ? <EmptyState title="Assessment structure not configured" message="Create assessment structures before entering scores." /> : !students.length ? <EmptyState title="No enrolled students" message={`${selectedClassName} has no students for result entry.`} /> : <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">{selectedClassName} {selectedSubjectName ? `· ${selectedSubjectName}` : ""}</h2><p className="text-xs text-slate-500">Maximum total: {totalMaximum}</p></div><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Student</th>{structures.map((structure) => <th className="p-3" key={structure.id}>{structure.name}<span className="block normal-case">Max {structure.maximum_marks}</span></th>)}<th className="p-3">Total</th><th className="p-3">Grade</th></tr></thead><tbody className="divide-y">{students.map((enrollment) => { const student = enrollment.student || {}; const name = student.full_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || `Student #${enrollment.id}`; const total = totalFor(enrollment.id); return <tr key={enrollment.id}><td className="p-3 font-semibold">{name}<span className="block text-xs font-normal text-slate-500">{student.admission_number || ""}</span></td>{structures.map((structure) => <td className="p-3" key={structure.id}><input type="number" min="0" max={structure.maximum_marks} value={scores[enrollment.id]?.[structure.id] ?? 0} onChange={(event) => updateScore(enrollment.id, structure.id, event.target.value)} className="min-h-10 w-24 rounded-lg border border-slate-300 px-2" /></td>)}<td className="p-3 font-bold">{total}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{gradeFor(total)}</span></td></tr>; })}</tbody></table></section>}
    </>}
  </PageContainer>;
}
