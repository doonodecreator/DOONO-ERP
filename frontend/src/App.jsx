import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getPrimaryRoleSlug } from "./utils/role";
import { normalizeSchoolOsPage } from "./config/schoolOsCapabilities";
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
import BackupOperations from "./pages/BackupOperations";
import Marketplace from "./pages/Marketplace";
import MarketplaceAdmin from "./pages/MarketplaceAdmin";
import Benchmarking from "./pages/Benchmarking";
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
import ReportCardVerification from "./pages/ReportCardVerification";

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
import SupportCentre from "./pages/SupportCentre";
import WorkInbox from "./pages/WorkInbox";
import Notifications from "./pages/Notifications";
import GlobalSearch from "./pages/GlobalSearch";
import AiTutor from "./pages/AiTutor";
import StudentCommunity from "./pages/StudentCommunity";
import CommunityModeration from "./pages/CommunityModeration";
import ExchangeWorkspace from "./pages/ExchangeWorkspace";
import LiveRooms from "./pages/LiveRooms";
import SchoolInsights from "./pages/SchoolInsights";
import FeatureFlags from "./pages/FeatureFlags";
import NotificationPreferences from "./pages/NotificationPreferences";
import SchoolApiKeys from "./pages/SchoolApiKeys";
import OAuthClients from "./pages/OAuthClients";
import AcceptRoleInvitation from "./pages/AcceptRoleInvitation";
import InvitationProfileSetup from "./pages/InvitationProfileSetup";
import ChangePassword from "./pages/ChangePassword";
import EmailVerification from "./pages/EmailVerification";
import EmailVerified from "./pages/EmailVerified";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
    setPage(normalizeSchoolOsPage(requestedPage));
  };

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [recordFocus, setRecordFocus] = useState(null);

  const openSearchResult = (result) => {
    const id = Number(result?.id);
    if (!result?.type || !Number.isInteger(id) || id < 1) return;

    if (result.type === "student") {
      setSelectedStudent({ id });
      setPage("student-profile");
      return;
    }
    if (result.type === "parent") {
      setRecordFocus({ type: "parent", id });
      setPage("parents");
      return;
    }
    if (result.type === "staff") {
      setRecordFocus({ type: "staff", id });
      setPage("staff");
      return;
    }

    setRecordFocus({ type: result.type, id });
    setPage(normalizeSchoolOsPage(result.page || "dashboard"));
  };

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
      content = <Staff setPage={navigatePage} setSelectedStaff={setSelectedStaff} focusId={recordFocus?.type === "staff" ? recordFocus.id : null} />;
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
      content = <Parents setPage={navigatePage} setSelectedParent={setSelectedParent} focusId={recordFocus?.type === "parent" ? recordFocus.id : null} />;
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
      content = <BackupOperations />;
      break;
    case "marketplace-review":
      content = <MarketplaceAdmin />;
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
    case "school-api-keys":
      content = <SchoolApiKeys />;
      break;
    case "oauth-clients":
      content = <OAuthClients />;
      break;
    case "marketplace":
      content = <Marketplace />;
      break;
    case "benchmarking":
      content = <Benchmarking />;
      break;
    case "support-centre":
      content = <SupportCentre />;
      break;
    case "work-inbox":
      content = <WorkInbox setPage={navigatePage} />;
      break;
    case "notifications":
      content = <Notifications />;
      break;
    case "global-search":
      content = <GlobalSearch setPage={navigatePage} />;
      break;
    case "ai-tutor":
      content = <AiTutor />;
      break;
    case "student-community":
      content = <StudentCommunity />;
      break;
    case "community-moderation":
      content = <CommunityModeration />;
      break;
    case "exchange":
      content = <ExchangeWorkspace />;
      break;
    case "live-rooms":
      content = <LiveRooms />;
      break;
    case "school-insights":
      content = <SchoolInsights />;
      break;
    case "feature-flags":
      content = <FeatureFlags />;
      break;
    case "notification-preferences":
      content = <NotificationPreferences />;
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

      <Route path="/verify/report-card/:token" element={<ReportCardVerification />} />

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
