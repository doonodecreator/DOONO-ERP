import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getPrimaryRoleSlug } from "./utils/role";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./components/feedback/ErrorBoundary";
import Login from "./pages/Login";
import PublicRegister from "./pages/PublicRegister";
import PublicHome from "./pages/PublicHome";
import FeePayments from "./pages/FeePayments";
import Books from "./pages/Books";
import Hostels from "./pages/Hostels";
import Clinic from "./pages/Clinic";
import Transport from "./pages/Transport";
import Visitors from "./pages/Visitors";
import Expenses from "./pages/Expenses";
import Examinations from "./pages/Examinations";
import Assignments from "./pages/Assignments";
import Communication from "./pages/Communication";
import CbtQuestionBank from "./pages/CbtQuestionBank";
import CbtAssessments from "./pages/CbtAssessments";
import StudentCbt from "./pages/StudentCbt";
import TransportTracking from "./pages/TransportTracking";
import LeaveApplication from "./pages/LeaveApplication";
import AssessmentActivities from "./pages/AssessmentActivities";
import PlatformOperations from "./pages/PlatformOperations";
import Payroll from "./pages/Payroll";
import FinancialReports from "./pages/FinancialReports";
import LibraryWorkspace from "./pages/LibraryWorkspace";
import StudentLibrary from "./pages/StudentLibrary";
import OperationalReports from "./pages/OperationalReports";
import ReceptionActivities from "./pages/ReceptionActivities";
import TransportLogs from "./pages/TransportLogs";
import FeeAdjustments from "./pages/FeeAdjustments";
import Graduation from "./pages/Graduation";

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
import SchoolSetup from "./pages/SchoolSetup";
import Divisions from "./pages/Divisions";
import AcademicSessions from "./pages/AcademicSessions";
import Terms from "./pages/Terms";

import Attendance from "./pages/Attendance";
import StaffAttendance from "./pages/StaffAttendance";
import LeaveRequests from "./pages/LeaveRequests";
import DisciplineCases from "./pages/DisciplineCases";
import SafetyIncidents from "./pages/SafetyIncidents";
import AssetRegister from "./pages/AssetRegister";
import SchoolEvents from "./pages/SchoolEvents";
import SchoolFacilities from "./pages/SchoolFacilities";

import Results from "./pages/Results";
import ResultEntry from "./pages/ResultEntry";
import AssessmentStructures from "./pages/AssessmentStructures";
import Fees from "./pages/Fees";
import FeesAndPayments from "./pages/FeesAndPayments";
import PortalFees from "./pages/PortalFees";

import Timetable from "./pages/Timetable";

import ReportCards from "./pages/ReportCards";

import Promotions from "./pages/Promotions";

import Subscriptions from "./pages/Subscriptions";
import SubscriptionPayment from "./pages/SubscriptionPayment";

import Settings from "./pages/Settings";
import ProfileSettings from "./pages/ProfileSettings";
import SchoolBranding from "./pages/SchoolBranding";
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
import OrganizationOwnerWorkspace from "./pages/OrganizationOwnerWorkspace";
import RoleInvitations from "./pages/RoleInvitations";
import AcceptRoleInvitation from "./pages/AcceptRoleInvitation";
import InvitationProfileSetup from "./pages/InvitationProfileSetup";
import ChangePassword from "./pages/ChangePassword";
import EmailVerification from "./pages/EmailVerification";
import EmailVerified from "./pages/EmailVerified";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const PAGE_ALIASES = {
  my_schools: "schools",
  leadership: "role-invitations",
  reports: "report-cards",
  school_setup: "school-setup",
  approve_results: "results",
  events: "school-events",
  leave_mgmt: "leave-requests",
  assessment: "results",
  primary_classes: "classes",
  promotion: "promotions",
  results_approvals: "results",
  behaviour: "discipline-cases",
  my_class: "classes",
  library: "books",
  hostels: "hostels",
  clinic_visits: "clinic",
  transport: "transport",
  front_desk: "visitors",
  fee_payment: "fees-payments",
  examinations: "examinations",
  ca_scores: "result-entry",
};

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
  cashier: CashierDashboard,
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
  const { onboardingStep, mustChangePassword, refreshContext, roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();

  const [page, setPage] = useState("dashboard");

  const navigatePage = (requestedPage) => {
    setPage(PAGE_ALIASES[requestedPage] || requestedPage);
  };

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  if (mustChangePassword) {
    return <ChangePassword />;
  }

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

  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const RoleDashboard = ROLE_DASHBOARDS[roleSlug];

  let content = RoleDashboard ? <RoleDashboard setPage={navigatePage} /> : <Dashboard />;

  switch (page) {
    case "dashboard":
      content = RoleDashboard ? <RoleDashboard setPage={navigatePage} /> : <Dashboard />;
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
    case "organization-users":
      content = <OrganizationOwnerWorkspace defaultTab="organization-users" setPage={navigatePage} />;
      break;
    case "organization-profile":
      content = <OrganizationOwnerWorkspace defaultTab="organization-profile" setPage={navigatePage} />;
      break;
    case "organization-reports":
      content = <OrganizationOwnerWorkspace defaultTab="organization-reports" setPage={navigatePage} />;
      break;
    case "schools":
      content = <Schools />;
      break;
    case "audit-logs":
      content = <AuditLogs />;
      break;
    case "students":
      content = <Students setPage={navigatePage} setSelectedStudent={setSelectedStudent} />;
      break;
    case "admissions":
    case "add-student":
      content = <Admissions setPage={navigatePage} />;
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
      content = <Staff setPage={navigatePage} setSelectedStaff={setSelectedStaff} />;
      break;
    case "role-invitations":
      content = <RoleInvitations setPage={navigatePage} />;
      break;
    case "add-staff":
      content = <AddStaff setPage={navigatePage} />;
      break;
    case "edit-staff":
      content = <EditStaff staff={selectedStaff} setPage={navigatePage} />;
      break;
    case "parents":
      content = <Parents setPage={navigatePage} setSelectedParent={setSelectedParent} />;
      break;
    case "add-parent":
      content = <AddParent setPage={navigatePage} />;
      break;
    case "parent-profile":
      content = <ParentProfile parent={selectedParent} setPage={navigatePage} />;
      break;
    case "edit-parent":
      content = <EditParent parent={selectedParent} setSelectedParent={setSelectedParent} setPage={navigatePage} />;
      break;
    case "link-student-parent":
      content = <LinkStudentToParent parent={selectedParent} setPage={navigatePage} />;
      break;
    case "teachers":
      content = <Teachers setPage={navigatePage} setSelectedTeacher={setSelectedTeacher} />;
      break;
    case "add-teacher":
      content = <AddTeacher setPage={navigatePage} />;
      break;
    case "teacher-profile":
      content = <TeacherProfile teacher={selectedTeacher} setPage={navigatePage} />;
      break;
    case "edit-teacher":
      content = <EditTeacher teacher={selectedTeacher} setSelectedTeacher={setSelectedTeacher} setPage={navigatePage} />;
      break;
    case "subjects":
      content = <Subjects setPage={navigatePage} teacherOnly={roleSlug === "teacher"} />;
      break;
    case "add-subject":
      content = <AddSubject setPage={navigatePage} />;
      break;
    case "school-setup":
      content = <SchoolSetup setPage={navigatePage} />;
      break;
    case "divisions":
      content = <Divisions />;
      break;
    case "classes":
      content = <Classes teacherOnly={roleSlug === "teacher"} />;
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
    case "staff-attendance":
      content = <StaffAttendance />;
      break;
    case "leave-requests":
      content = <LeaveRequests />;
      break;
    case "discipline-cases":
      content = <DisciplineCases />;
      break;
    case "safety-incidents":
      content = <SafetyIncidents />;
      break;
    case "asset-register":
      content = <AssetRegister />;
      break;
    case "school-events":
      content = <SchoolEvents />;
      break;
    case "school-facilities":
      content = <SchoolFacilities />;
      break;
    case "results":
      content = <Results setPage={navigatePage} />;
      break;
    case "examinations":
      content = <Examinations />;
      break;
    case "assignments":
      content = <Assignments />;
      break;
    case "library":
      content = roleSlug === "student" ? <StudentLibrary /> : <LibraryWorkspace />;
      break;
    case "communication":
      content = <Communication />;
      break;
    case "notices":
      content = <Communication mode="notices" />;
      break;
    case "messages":
      content = <Communication mode="messages" />;
      break;
    case "cbt":
      content = roleSlug === "student" ? <StudentCbt /> : <CbtQuestionBank setPage={navigatePage} />;
      break;
    case "cbt-assessments":
      content = <CbtAssessments />;
      break;
    case "transport-tracking":
      content = <TransportTracking />;
      break;
    case "leave-application":
      content = <LeaveApplication />;
      break;
    case "external-exams":
      content = <AssessmentActivities mode="external_exam" />;
      break;
    case "practicals":
      content = <AssessmentActivities mode="practical" />;
      break;
    case "platform-payments":
      content = <PlatformOperations mode="payments" />;
      break;
    case "countries-currency":
      content = <PlatformOperations mode="currency" />;
      break;
    case "email-sms-settings":
      content = <PlatformOperations mode="email" />;
      break;
    case "backups-logs":
      content = <PlatformOperations mode="logs" />;
      break;
    case "system-health":
      content = <PlatformOperations mode="health" />;
      break;
    case "payroll":
      content = <Payroll />;
      break;
    case "payment-reports":
      content = <FinancialReports defaultTab="payment-reports" />;
      break;
    case "fee-discounts":
      content = <FeeAdjustments defaultTab="discounts" />;
      break;
    case "reverse-payment":
      content = <FeeAdjustments defaultTab="reverse" />;
      break;
    case "financial-reports":
      content = <FinancialReports defaultTab="overview" />;
      break;
    case "profit-loss":
      content = <FinancialReports defaultTab="profit-loss" />;
      break;
    case "tax-reports":
      content = <FinancialReports defaultTab="tax-reports" />;
      break;
    case "result-entry":
      content = <ResultEntry />;
      break;
    case "assessment-structures":
      content = <AssessmentStructures setPage={navigatePage} />;
      break;
    case "fees":
      content = <Fees setPage={navigatePage} />;
      break;
    case "fees-payments":
      content = ["parent", "student"].includes(roleSlug) ? <PortalFees /> : <FeesAndPayments />;
      break;
    case "books":
      content = <Books />;
      break;
    case "library-members":
      content = <LibraryWorkspace defaultTab="members" />;
      break;
    case "library-reports":
      content = <LibraryWorkspace defaultTab="reports" />;
      break;
    case "hostels":
      content = <Hostels />;
      break;
    case "hostel-reports":
      content = <OperationalReports mode="hostel" />;
      break;
    case "transport-reports":
      content = <OperationalReports mode="transport" />;
      break;
    case "transport-fuel":
      content = <TransportLogs defaultType="fuel" />;
      break;
    case "transport-maintenance":
      content = <TransportLogs defaultType="maintenance" />;
      break;
    case "reception-reports":
      content = <OperationalReports mode="reception" />;
      break;
    case "staff-check-in":
      content = <ReceptionActivities defaultType="staff_check_in" />;
      break;
    case "reception-calls":
      content = <ReceptionActivities defaultType="call" />;
      break;
    case "clinic":
      content = <Clinic />;
      break;
    case "transport":
      content = <Transport />;
      break;
    case "visitors":
      content = <Visitors />;
      break;
    case "expenses":
      content = <Expenses />;
      break;
    case "timetable":
      content = <Timetable />;
      break;
    case "report-cards":
      content = <ReportCards />;
      break;
    case "promotion":
    case "promotions":
      content = <Promotions />;
      break;
    case "graduation":
      content = <Graduation />;
      break;
    case "subscriptions":
      content = <Subscriptions />;
      break;
    case "settings":
      content = <Settings setPage={navigatePage} />;
      break;
    case "profile":
      content = <ProfileSettings />;
      break;
    case "school-branding":
      content = <SchoolBranding setPage={navigatePage} />;
      break;
    default:
      content = RoleDashboard ? <RoleDashboard setPage={navigatePage} /> : <Dashboard />;
  }

  return (
    <DashboardLayout page={page} setPage={navigatePage}>
      <ErrorBoundary key={page}>
        {content}
      </ErrorBoundary>
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
        path="/payment-callback"
        element={isAuthenticated ? <FeePayments /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/fees-payments"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/subscription-payment"
        element={isAuthenticated ? <SubscriptionPayment /> : <Navigate to="/login" replace />}
      />

      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/forgot-password/reset" element={<ResetPassword />} />

      <Route
        path="/role-invitation/accept"
        element={<AcceptRoleInvitation />}
      />

      <Route
        path="/role-invitation/profile"
        element={isAuthenticated ? <InvitationProfileSetup /> : <Navigate to="/login" replace />}
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
