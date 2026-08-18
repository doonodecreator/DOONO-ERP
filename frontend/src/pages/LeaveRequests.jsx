import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const LEAVE_TYPES = [
  "Annual",
  "Sick",
  "Maternity",
  "Paternity",
  "Compassionate",
  "Study",
  "Other",
];

const LEADERSHIP_ROLES = [
  "super_admin",
  "proprietor",
  "principal",
  "vice_principal_admin",
];

const initialForm = {
  staff_id: "",
  leave_type: "Annual",
  start_date: "",
  end_date: "",
  reason: "",
};

export default function LeaveRequests() {
  const { user, roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({
    roles,
    isPlatformAdmin,
    isOrganizationOwner,
    school,
  });
  const isLeadership = LEADERSHIP_ROLES.includes(roleSlug);

  const [records, setRecords] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      const [requestResponse, optionsResponse] = await Promise.all([
        api.get("/leave-requests", { params: { per_page: 50 } }),
        api.get("/leave-requests/options"),
      ]);

      const requests = Array.isArray(requestResponse?.data?.data)
        ? requestResponse.data.data
        : null;
      const staff = Array.isArray(optionsResponse?.data?.data)
        ? optionsResponse.data.data
        : null;

      if (!requests || !staff) {
        throw new Error("The leave request response is not a valid collection.");
      }

      setRecords(requests);
      setStaffOptions(staff);
      setCanManage(Boolean(optionsResponse?.data?.can_manage));
      setForm((current) => ({
        ...current,
        staff_id: current.staff_id || (staff.length === 1 ? String(staff[0].id) : ""),
      }));
    } catch (requestError) {
      setRecords([]);
      setStaffOptions([]);
      setError(requestError.message || "Unable to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const submitRequest = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await api.post("/leave-requests", {
        ...form,
        staff_id: Number(form.staff_id),
      });
      setForm((current) => ({
        ...initialForm,
        staff_id: current.staff_id,
      }));
      setMessage("Leave request submitted successfully.");
      await loadPage();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit the leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewRequest = async (request, status) => {
    const reviewerNote = window.prompt(
      `Optional note for this ${status.toLowerCase()} decision:`,
      request.reviewer_note || ""
    );

    if (reviewerNote === null) {
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post(`/leave-requests/${request.id}/review`, {
        status,
        reviewer_note: reviewerNote,
      });
      setMessage(`Leave request ${status.toLowerCase()}.`);
      await loadPage();
    } catch (requestError) {
      setError(requestError.message || "Unable to review the leave request.");
    }
  };

  const cancelRequest = async (request) => {
    if (!window.confirm("Cancel this pending leave request?")) {
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post(`/leave-requests/${request.id}/cancel`);
      setMessage("Leave request cancelled.");
      await loadPage();
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel the leave request.");
    }
  };

  const summary = useMemo(() => records.reduce((totals, record) => {
    totals[record.status] = (totals[record.status] || 0) + 1;
    return totals;
  }, { Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 }), [records]);

  const columns = [
    {
      key: "staff",
      label: "Staff member",
      render: (row) => row.staff?.full_name || "—",
    },
    { key: "leave_type", label: "Leave type" },
    {
      key: "period",
      label: "Period",
      render: (row) => `${row.start_date} to ${row.end_date}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => row.status,
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => row.reason,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const canReview = canManage && row.status === "Pending" && row.staff?.user_id !== user?.id;
        const canCancel = row.status === "Pending" && (canManage || row.staff?.user_id === user?.id);

        return (
          <div className="leave-request-actions">
            {canReview && (
              <>
                <button type="button" onClick={() => reviewRequest(row, "Approved")}>Approve</button>
                <button type="button" onClick={() => reviewRequest(row, "Rejected")}>Reject</button>
              </>
            )}
            {canCancel && (
              <button type="button" onClick={() => cancelRequest(row)}>Cancel</button>
            )}
            {!canReview && !canCancel && "—"}
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Leave Requests"
        subtitle={isLeadership ? "Submit and review school staff leave requests." : "Submit and track your own leave requests."}
      />

      <form onSubmit={submitRequest} className="leave-request-form">
        <label>
          Staff member
          <select
            value={form.staff_id}
            onChange={(event) => setForm((current) => ({ ...current, staff_id: event.target.value }))}
            disabled={!isLeadership && staffOptions.length === 1}
            required
          >
            <option value="">Select staff member</option>
            {Array.isArray(staffOptions) && staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name} ({staff.staff_number})
              </option>
            ))}
          </select>
        </label>
        <label>
          Leave type
          <select
            value={form.leave_type}
            onChange={(event) => setForm((current) => ({ ...current, leave_type: event.target.value }))}
          >
            {LEAVE_TYPES.map((leaveType) => (
              <option key={leaveType} value={leaveType}>{leaveType}</option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            value={form.start_date}
            onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
            required
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={form.end_date}
            onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
            required
          />
        </label>
        <label>
          Reason
          <textarea
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            required
            maxLength={2000}
          />
        </label>
        <button type="submit" disabled={submitting || !form.staff_id}>
          {submitting ? "Submitting..." : "Submit leave request"}
        </button>
      </form>

      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}

      <div className="leave-request-summary">
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} className="leave-request-summary-card">
            <span>{status}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading leave requests..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No leave requests found"
          message="Submit a leave request when leave approval is required."
        />
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(records) ? records : []}
          emptyMessage="No leave requests found."
        />
      )}
    </div>
  );
}
