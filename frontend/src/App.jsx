import { useState } from "react";
import { useAuth } from "./context/AuthContext";

import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import PublicRegister from "./pages/PublicRegister";
import PublicHome from "./pages/PublicHome";

import Dashboard from "./pages/Dashboard";

import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import StudentProfile from "./pages/StudentProfile";
import EditStudent from "./pages/EditStudent";

import Parents from "./pages/Parents";
import AddParent from "./pages/AddParent";
import ParentProfile from "./pages/ParentProfile";
import EditParent from "./pages/EditParent";
import LinkStudentToParent from "./pages/LinkStudentToParent";

import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/TeacherProfile";
import AddTeacher from "./pages/AddTeacher";
import EditTeacher from "./pages/EditTeacher";

import Subjects from "./pages/Subjects";
import AddSubject from "./pages/AddSubject";

import Classes from "./pages/Classes";
import Streams from "./pages/Streams";

import AcademicSessions from "./pages/AcademicSessions";
import Terms from "./pages/Terms";

import Attendance from "./pages/Attendance";

import Results from "./pages/Results";
import ResultEntry from "./pages/ResultEntry";

import Fees from "./pages/Fees";
import FeesAndPayments from "./pages/FeesAndPayments";

import Timetable from "./pages/Timetable";

import ReportCards from "./pages/ReportCards";

import Promotions from "./pages/Promotions";

import Subscriptions from "./pages/Subscriptions";

import Settings from "./pages/Settings";

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  const [page, setPage] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  if (loading) {
    return <h2 style={{ padding: 40 }}>Loading...</h2>;
  }

  // 🌐 Public routes accessible to everyone without login
  if (window.location.pathname === "/register") {
    return <PublicRegister />;
  }

  if (window.location.pathname === "/" || window.location.pathname === "/home") {
    return <PublicHome />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  let content = <Dashboard />;

  switch (page) {
    case "students":
      content = <Students setPage={setPage} setSelectedStudent={setSelectedStudent} />;
      break;
    case "add-student":
      content = <AddStudent setPage={setPage} />;
      break;
    case "student-profile":
      content = <StudentProfile student={selectedStudent} setPage={setPage} />;
      break;
    case "edit-student":
      content = <EditStudent student={selectedStudent} setSelectedStudent={setSelectedStudent} setPage={setPage} />;
      break;
    case "parents":
      content = <Parents setPage={setPage} setSelectedParent={setSelectedParent} />;
      break;
    case "add-parent":
      content = <AddParent setPage={setPage} />;
      break;
    case "parent-profile":
      content = <ParentProfile parent={selectedParent} setPage={setPage} />;
      break;
    case "edit-parent":
      content = <EditParent parent={selectedParent} setSelectedParent={setSelectedParent} setPage={setPage} />;
      break;
    case "link-student-parent":
      content = <LinkStudentToParent parent={selectedParent} setPage={setPage} />;
      break;
    case "teachers":
      content = <Teachers setPage={setPage} setSelectedTeacher={setSelectedTeacher} />;
      break;
    case "add-teacher":
      content = <AddTeacher setPage={setPage} />;
      break;
    case "teacher-profile":
      content = <TeacherProfile teacher={selectedTeacher} setPage={setPage} />;
      break;
    case "edit-teacher":
      content = <EditTeacher teacher={selectedTeacher} setSelectedTeacher={setSelectedTeacher} setPage={setPage} />;
      break;
    case "subjects":
      content = <Subjects setPage={setPage} />;
      break;
    case "add-subject":
      content = <AddSubject setPage={setPage} />;
      break;
    case "classes":
      content = <Classes />;
      break;
    case "streams":
      content = <Streams />;
      break;
    case "academic-sessions":
      content = <AcademicSessions />;
      break;
    case "terms":
      content = <Terms />;
      break;
    case "attendance":
      content = <Attendance />;
      break;
    case "results":
      content = <Results />;
      break;
    case "result-entry":
      content = <ResultEntry />;
      break;
    case "fees":
      content = <Fees />;
      break;
    case "fees-payments":
      content = <FeesAndPayments />;
      break;
    case "timetable":
      content = <Timetable />;
      break;
    case "report-cards":
      content = <ReportCards />;
      break;
    case "promotions":
      content = <Promotions />;
      break;
    case "subscriptions":
      content = <Subscriptions />;
      break;
    case "settings":
      content = <Settings />;
      break;
    default:
      content = <Dashboard />;
  }

  return (
    <DashboardLayout page={page} setPage={setPage}>
      {content}
    </DashboardLayout>
  );
}

