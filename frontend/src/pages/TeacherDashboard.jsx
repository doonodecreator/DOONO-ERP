import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import Button from "../components/forms/Button";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import "./TeacherDashboard.css";

const TABS = [
  { id: "my_classes", label: "My Classes", page: "classes" },
  { id: "my_subjects", label: "My Subjects", page: "subjects" },
  { id: "my_timetable", label: "My Timetable", page: "timetable" },
  { id: "attendance", label: "Attendance", page: "attendance" },
  { id: "assignments", label: "Assignments", page: "assignments" },
  { id: "ca_scores", label: "CA Scores", page: "result-entry" },
  { id: "students", label: "My Students", page: "students" },
];

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

export default function TeacherDashboard({ setPage }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/teacher/dashboard");
      const payload = response?.data;
      setData(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null);
    } catch (requestError) {
      setData(null);
      setError(requestError?.response?.data?.message || "Unable to load teacher dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const teacher = data?.teacher_profile || {};
  const context = data?.context || {};
  const classes = useMemo(() => arrayOrEmpty(data?.my_classes), [data]);
  const subjects = useMemo(() => arrayOrEmpty(data?.my_subjects), [data]);
  const students = useMemo(() => arrayOrEmpty(data?.my_students), [data]);
  const timetable = useMemo(() => arrayOrEmpty(data?.timetable), [data]);
  const assignments = useMemo(() => arrayOrEmpty(data?.recent_assignments), [data]);
  const tasks = data?.pending_tasks && typeof data.pending_tasks === "object" ? data.pending_tasks : {};

  function openTab(tab) {
    if (tab?.page && typeof setPage === "function") setPage(tab.page);
  }

  if (loading) {
    return <PageContainer><LoadingSpinner text="Loading teacher portal..." /></PageContainer>;
  }

  if (!data) {
    return <PageContainer><Alert variant="error" action={<Button size="sm" variant="secondary" onClick={loadData}>Retry</Button>}>{error || "Teacher dashboard data is unavailable."}</Alert></PageContainer>;
  }

  const studentColumns = [
    { key: "full_name", label: "Student", render: (student) => <strong>{student.full_name || "Unnamed student"}</strong> },
    { key: "admission_number", label: "Admission no.", render: (student) => student.admission_number || "—" },
    { key: "class", label: "Class", render: (student) => `${student.class || "—"}${student.stream ? ` · ${student.stream}` : ""}` },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${teacher.first_name || "Teacher"}`}
        subtitle={`${teacher.department || "Teaching staff"} · ${teacher.employee_id || "No staff number"} · ${context.school || "School"} · ${context.session || "No active session"} / ${context.term || "No active term"}`}
        action={<Button onClick={() => openTab({ page: "result-entry" })}>Upload CA Scores</Button>}
      />

      {error && <Alert variant="error" action={<Button size="sm" variant="secondary" onClick={loadData}>Retry</Button>}>{error}</Alert>}

      <div className="teacher-dashboard-tabs" role="tablist" aria-label="Teacher workspaces">
        {TABS.map((tab) => <Button key={tab.id} size="sm" variant="secondary" onClick={() => openTab(tab)}>{tab.label}</Button>)}
      </div>

      {(Number(tasks.mark_attendance) > 0 || Number(tasks.upload_ca) > 0) && (
        <div className="teacher-task-strip">
          {Number(tasks.mark_attendance) > 0 && <Alert variant="warning" action={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "attendance" })}>Mark attendance</Button>}>Attendance is pending for {tasks.mark_attendance} class(es).</Alert>}
          {Number(tasks.upload_ca) > 0 && <Alert variant="info" action={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "result-entry" })}>Open scores</Button>}>CA scores are pending for {tasks.upload_ca} subject(s).</Alert>}
        </div>
      )}

      <DashboardGrid>
        <StatCard title="Assigned classes" value={classes.length} subtitle="Classes from your active timetable" color="primary" />
        <StatCard title="Assigned subjects" value={subjects.length} subtitle="Subjects assigned to your classes" color="success" />
        <StatCard title="My students" value={students.length} subtitle="Students in assigned classes" color="info" />
        <StatCard title="Recent assignments" value={assignments.length} subtitle="Your latest assignment records" color="warning" />
      </DashboardGrid>

      <div className="teacher-dashboard-section-grid">
        <SectionCard title="My Classes" subtitle="Read-only class assignments from the school timetable." actions={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "classes" })}>View classes</Button>}>
          {classes.length === 0 ? <EmptyState title="No classes assigned" message="Ask the school administrator to assign your lessons in the timetable." /> : <div className="teacher-record-list">{classes.slice(0, 6).map((item) => <div className="teacher-record-row" key={`${item.class_id}-${item.stream_id}`}><strong>{item.name}</strong><span>{item.student_count ?? 0} students</span></div>)}</div>}
        </SectionCard>

        <SectionCard title="My Subjects" subtitle="Subjects linked to your active timetable." actions={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "subjects" })}>View subjects</Button>}>
          {subjects.length === 0 ? <EmptyState title="No subjects assigned" message="Subjects will appear after your timetable assignments are saved." /> : <div className="teacher-record-list">{subjects.slice(0, 6).map((item) => <div className="teacher-record-row" key={`${item.subject_id}-${item.class}-${item.id}`}><strong>{item.name}</strong><span>{item.class || "Assigned class"}</span></div>)}</div>}
        </SectionCard>

        <SectionCard title="Term Timetable" subtitle="Your next scheduled lessons." actions={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "timetable" })}>View timetable</Button>}>
          {timetable.length === 0 ? <EmptyState title="No timetable periods" message="The school has not assigned active lesson periods for you yet." /> : <div className="teacher-record-list">{timetable.slice(0, 6).map((slot) => <div className="teacher-record-row teacher-timetable-row" key={slot.id}><div><strong>{slot.subject || "Lesson"}</strong><small>{slot.class || "Class"}{slot.stream ? ` · ${slot.stream}` : ""}</small></div><span>{slot.day_of_week || "—"}<br />{slot.start_time || ""} – {slot.end_time || ""}</span></div>)}</div>}
        </SectionCard>

        <SectionCard title="Recent Assignments" subtitle="Assignments you created for your classes." actions={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "assignments" })}>Open workspace</Button>}>
          {assignments.length === 0 ? <EmptyState title="No recent assignments" message="Create an assignment from the Assignments workspace." /> : <div className="teacher-record-list">{assignments.map((assignment) => <div className="teacher-record-row" key={assignment.id}><div><strong>{assignment.title || "Assignment"}</strong><small>{assignment.subject || "Subject"} · {assignment.class || "Class"}</small></div><span>{assignment.due_date || "No due date"}</span></div>)}</div>}
        </SectionCard>
      </div>

      <SectionCard title="My Students" subtitle="Students in classes currently assigned to you." actions={<Button size="sm" variant="secondary" onClick={() => openTab({ page: "students" })}>Open student list</Button>}>
        <DataTable columns={studentColumns} data={students.slice(0, 100)} loading={false} emptyTitle="No assigned students" emptyMessage="Students will appear when classes are assigned to your timetable." />
      </SectionCard>
    </PageContainer>
  );
}
