import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

const numberValue = (value) => Number(value ?? 0).toLocaleString();
const moneyValue = (value) => `₦${numberValue(value)}`;

export default function Dashboard() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userRole = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school }) || "user";
  const isSuperAdmin = userRole === "super_admin" || stats?.dashboard_type === "super_admin";
  const isSchoolAdmin = ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "bursar"].includes(userRole);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/dashboard");
      setStats(response?.data?.data || response?.data || {});
    } catch (err) {
      setError(err?.message || err?.data?.message || "Unable to load dashboard metrics. Please check your network or backend connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <PageContainer><PageHeader title="DOONO De Creator ERP" subtitle="Your role-based operational overview." /><LoadingSpinner text="Loading dashboard analytics..." /></PageContainer>;

  const roleLabel = isSuperAdmin ? "Software Owner" : userRole.replace(/_/g, " ");
  const cards = [
    ["Organizations", stats?.organizations, "primary", isSuperAdmin],
    ["Schools", stats?.schools, "info", isSuperAdmin],
    ["Students", stats?.students, "success", isSuperAdmin || isSchoolAdmin],
    ["Staff", stats?.staff, "success", isSuperAdmin || isSchoolAdmin],
    ["Parents", stats?.parents, "purple", isSuperAdmin || isSchoolAdmin],
    ["Subjects", stats?.subjects, "warning", isSuperAdmin || isSchoolAdmin],
    ["Classes", stats?.classes, "info", isSuperAdmin || isSchoolAdmin],
    ["Streams", stats?.streams, "neutral", isSuperAdmin || isSchoolAdmin],
    ["Fee categories", stats?.fee_categories, "warning", isSuperAdmin || isSchoolAdmin],
    ["Student fees", stats?.student_fees, "danger", isSuperAdmin || isSchoolAdmin],
    ["Pending fees", stats?.pending_fees, "warning", isSuperAdmin || isSchoolAdmin],
    ["Partial fees", stats?.partial_fees, "info", isSuperAdmin || isSchoolAdmin],
    ["Paid fees", stats?.paid_fees, "success", isSuperAdmin || isSchoolAdmin],
    ["Examinations", stats?.examinations, "purple", true],
    ["Attendance records", stats?.attendance_records, "primary", true],
  ];

  return <PageContainer>
    <PageHeader title="DOONO De Creator ERP" subtitle={`${roleLabel} dashboard · Live school and platform metrics.`} />
    {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={loadDashboard}>Retry connection</Button>}>{error}</Alert>}
    {!error && <>
      <DashboardGrid>{cards.filter(([, , , show]) => show).map(([title, value, color]) => <StatCard key={title} title={title} value={numberValue(value)} color={color} />)}</DashboardGrid>
      {(isSuperAdmin || isSchoolAdmin) ? <div className="dashboard-section-grid">
        <SectionCard title="Finance summary" subtitle="Current payment and fee position for the active scope.">
          <div className="dashboard-list"><div className="dashboard-list-row"><span className="dashboard-list-title">Payments received</span><strong>{moneyValue(stats?.payments_received)}</strong></div><div className="dashboard-list-row"><span className="dashboard-list-title">Outstanding fees</span><strong>{moneyValue(stats?.outstanding_fees)}</strong></div></div>
        </SectionCard>
        <SectionCard title="System and access status" subtitle="The current account context and service availability.">
          <div className="dashboard-list"><div className="dashboard-list-row"><span className="dashboard-list-title">Active role</span><span className="status-badge status-badge-info">{roleLabel}</span></div><div className="dashboard-list-row"><span className="dashboard-list-title">System health</span><span className="status-badge status-badge-success">Online</span></div></div>
        </SectionCard>
      </div> : <SectionCard title="Dashboard scope" subtitle="Your dashboard only displays information available to the authenticated role and context."><EmptyState title="Role-specific workspace" message="Open a role workspace from the navigation to manage the records assigned to you." /></SectionCard>}
    </>}
  </PageContainer>;
}
