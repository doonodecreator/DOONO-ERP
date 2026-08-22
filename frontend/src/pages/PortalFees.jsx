import { useEffect, useState } from "react";
import api from "../services/api";
import FeePaymentModal from "../components/FeePaymentModal";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import Alert from "../components/feedback/Alert";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function PortalFees() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const endpoint = role === "parent" ? "/parent/dashboard" : "/student/dashboard";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [paymentTarget, setPaymentTarget] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(endpoint)
      .then((response) => {
        if (!active) return;
        const payload = response?.data && typeof response.data === "object" ? response.data : {};
        if (role === "parent") {
          const breakdown = payload.fee_breakdown && typeof payload.fee_breakdown === "object" ? Object.values(payload.fee_breakdown) : [];
          setGroups(Array.isArray(breakdown) ? breakdown : []);
        } else {
          const items = Array.isArray(payload.fee_breakdown) ? payload.fee_breakdown : [];
          setGroups(items.length ? [{ student_name: "My fees", items, total_due: payload.outstanding_fees || 0 }] : []);
        }
      })
      .catch((requestError) => active && setError(requestError?.response?.data?.message || "Unable to load your fee information."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [endpoint, role]);

  if (loading) return <LoadingSpinner text="Loading fee information..." />;

  const rows = groups.flatMap((group) => Array.isArray(group?.items) ? group.items.map((item) => ({ ...item, student_name: group.student_name })) : []);
  const columns = [
    { key: "student_name", label: "Student", render: (item) => item.student_name || "—" },
    { key: "category", label: "Fee item", render: (item) => item.category || "School fee" },
    { key: "amount", label: "Outstanding", render: (item) => `₦${Number(item.amount || 0).toLocaleString()}` },
    { key: "status", label: "Status", render: (item) => item.status || "Pending" },
    { key: "action", label: "Action", align: "right", render: (item) => <button type="button" onClick={() => setPaymentTarget({ studentId: item.student_id, studentFeeId: item.student_fee_id, feeCategoryId: item.fee_category_id, feeName: item.category, amount: item.amount })} className="ui-button ui-button-primary ui-button-sm">Pay</button> },
  ];

  return <PageContainer>
    <PageHeader title="Fees & Payments" subtitle={role === "parent" ? "Review and pay outstanding fees for each child." : "Review your outstanding school fees."} />
    {error && <Alert variant="error">{error}</Alert>}
    {rows.length === 0 ? <EmptyState title="No outstanding fees" message="There are no unpaid fee items on your portal account." /> : <DataTable columns={columns} data={rows} emptyTitle="No outstanding fees" emptyMessage="There are no unpaid fee items on your portal account." />}
    <FeePaymentModal isOpen={Boolean(paymentTarget)} onClose={() => setPaymentTarget(null)} {...(paymentTarget || {})} />
  </PageContainer>;
}
