import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getPrimaryRoleSlug } from "./utils/role";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import PublicRegister from "./pages/PublicRegister";
import PublicHome from "./pages/PublicHome";
import FeePayments from "./pages/FeePayments";

import Dashboard from "./pages/Dashboard";
import AddSchool from "./pages/AddSchool";
import Students from "./pages/Students";
import Admissions from "./pages/Admissions";
import StudentEnrollments from "./pages/StudentEnrollments";
import StudentProfile from "./pages/StudentProfile";
import EditStudent from "./pages/EditStudent";

import Staff from "./pages/Staff";
import AddStaff from "./pages/AddStaff";
import EditStaff from "./pages/EditStaff";

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
import Organizations from "./pages/Organizations";
import Schools from "./pages/Schools";
import AuditLogs from "./pages/AuditLogs";

import SecondaryPrincipalDashboard from "./pages/SecondaryPrincipalDashboard";
import PrimaryHeadmasterDashboard from "./pages/PrimaryHeadmasterDashboard";
import NurseryHeadDashboard from "./pages/NurseryHeadDashboard";
import VicePrincipalAdminDashboard from "./pages/VicePrincipalAdminDashboard";
import VicePrincipalAcademicDashboard from "./pages/VicePrincipalAcademicDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import ProprietorDashboard from "./pages/ProprietorDashboard";
import PlatformOwnerDashboard from "./pages/PlatformOwnerDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentPortal from "./pages/StudentPortal";
import ParentPortal from "./pages/ParentPortal";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import TransportDashboard from "./pages/TransportDashboard";
import HostelDashboard from "./pages/HostelDashboard";
import NurseDashboard from "./pages/NurseDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import FormTeacherDashboard from "./pages/FormTeacherDashboard";
import OrganizationOwnerDashboard from "./pages/OrganizationOwnerDashboard";

const ROLE_DASHBOARDS = {
  super_admin: PlatformOwnerDashboard,
  organization_owner: OrganizationOwnerDashboard,
  proprietor: ProprietorDashboard,
  principal: PrincipalDashboard,
  vice_principal_academic: VicePrincipalAcademicDashboard,
  vice_principal_admin: VicePrincipalAdminDashboard,
  teacher: TeacherDashboard,
  form_teacher: FormTeacherDashboard,
  bursar: CashierDashboard,
  accountant: AccountantDashboard,
  librarian: LibrarianDashboard,
  nurse: NurseDashboard,
  hostel_master: HostelDashboard,
  hostel_mistress: HostelDashboard,
  transport_manager: TransportDashboard,
  receptionist: ReceptionDashboard,
  nursery_head: NurseryHeadDashboard,
  primary_headmaster: PrimaryHeadmasterDashboard,
  secondary_principal: SecondaryPrincipalDashboard,
  parent: ParentPortal,
  student: StudentPortal,
};

function AuthenticatedApp() {
  const { onboardingStep, refreshContext, roles, isPlatformAdmin, isOrganizationOwner } = useAuth();

  const [page, setPage] = useState("dashboard");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  if (onboardingStep === "school_setup") {
    return (
      <AddSchool
        onSchoolAdded={async () => {
          await refreshContext();
          setPage("dashboard");
        }}
      />
    );
  }

  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner });
  const RoleDashboard = ROLE_DASHBOARDS[roleSlug];

  let content = RoleDashboard ? <RoleDashboard /> : <Dashboard />;

  switch (page) {
    case "dashboard":
      content = RoleDashboard ? <RoleDashboard /> : <Dashboard />;
      break;
    case "add-school":
      content = (
        <AddSchool
          onSchoolAdded={async () => {
            await refreshContext();
            setPage("dashboard");
          }}
        />
      );
      break;
    case "organizations":
      content = <Organizations />;
      break;
    case "schools":
      content = <Schools />;
      break;
    case "audit-logs":
      content = <AuditLogs />;
      break;
    case "students":
      content = <Students setPage={setPage} setSelectedStudent={setSelectedStudent} />;
      break;
    case "admissions":
    case "add-student":
      content = <Admissions setPage={setPage} />;
      break;
    case "student-enrollments":
      content = <StudentEnrollments />;
      break;
    case "student-profile":
      content = <StudentProfile student={selectedStudent} setPage={setPage} />;
      break;
    case "edit-student":
      content = <EditStudent student={selectedStudent} setSelectedStudent={setSelectedStudent} setPage={setPage} />;
      break;
    case "staff":
      content = <Staff setPage={setPage} setSelectedStaff={setSelectedStaff} />;
      break;
    case "add-staff":
      content = <AddStaff setPage={setPage} />;
      break;
    case "edit-staff":
      content = <EditStaff staff={selectedStaff} setPage={setPage} />;
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
      content = RoleDashboard ? <RoleDashboard /> : <Dashboard />;
  }

  return (
    <DashboardLayout page={page} setPage={setPage}>
      {content}
    </DashboardLayout>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <h2 style={{ padding: 40, color: "#fff", backgroundColor: "#090d16", minHeight: "100vh" }}>
        Loading...
      </h2>
    );
  }

  return (
    <Routes>
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <PublicRegister />}
      />

      <Route
        path="/home"
        element={isAuthenticated ? <Navigate to="/" replace /> : <PublicHome />}
      />

      <Route
        path="/fees-payments"
        element={isAuthenticated ? <FeePayments /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/"
        element={isAuthenticated ? <AuthenticatedApp /> : <PublicHome />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
