import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Excused"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffAttendance() {
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [roster, setRoster] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRoster = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/staff-attendances/roster", {
        params: { attendance_date: attendanceDate },
      });
      const records = Array.isArray(response?.data?.data)
        ? response.data.data
        : null;

      if (!records) {
        throw new Error("The staff attendance roster response is not a valid collection.");
      }

      setRoster(records);
      setAttendanceMap(
        records.reduce((map, staffMember) => {
          const record = staffMember.attendance || {};
          map[staffMember.staff_id] = {
            status: record.status || "Present",
            check_in_at: record.check_in_at || "",
            check_out_at: record.check_out_at || "",
            remarks: record.remarks || "",
          };
          return map;
        }, {})
      );
    } catch (requestError) {
      setRoster([]);
      setAttendanceMap({});
      setError(requestError.message || "Unable to load the staff attendance roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [attendanceDate]);

  const updateRecord = (staffId, field, value) => {
    setAttendanceMap((current) => ({
      ...current,
      [staffId]: {
        ...(current[staffId] || { status: "Present" }),
        [field]: value,
      },
    }));
  };

  const markAll = (status) => {
    setAttendanceMap((current) =>
      roster.reduce((next, staffMember) => ({
        ...next,
        [staffMember.staff_id]: {
          ...(current[staffMember.staff_id] || {}),
          status,
        },
      }), {})
    );
  };

  const summary = useMemo(() => {
    return roster.reduce(
      (totals, staffMember) => {
        const status = attendanceMap[staffMember.staff_id]?.status || "Present";
        totals[status] = (totals[status] || 0) + 1;
        return totals;
      },
      { Present: 0, Absent: 0, Late: 0, Excused: 0 }
    );
  }, [attendanceMap, roster]);

  const saveAttendance = async () => {
    if (!Array.isArray(roster) || roster.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.post("/staff-attendances/bulk", {
        attendance_date: attendanceDate,
        records: roster.map((staffMember) => ({
          staff_id: staffMember.staff_id,
          ...(attendanceMap[staffMember.staff_id] || { status: "Present" }),
        })),
      });
      setMessage("Staff attendance saved successfully.");
      await loadRoster();
    } catch (requestError) {
      setError(requestError.message || "Unable to save staff attendance.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "staff",
      label: "Staff member",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <div>{row.staff_number} · {row.designation || "No designation"}</div>
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row) => row.department || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <select
          value={attendanceMap[row.staff_id]?.status || "Present"}
          onChange={(event) => updateRecord(row.staff_id, "status", event.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      ),
    },
    {
      key: "check_in_at",
      label: "Check in",
      render: (row) => (
        <input
          type="time"
          value={attendanceMap[row.staff_id]?.check_in_at || ""}
          onChange={(event) => updateRecord(row.staff_id, "check_in_at", event.target.value)}
        />
      ),
    },
    {
      key: "check_out_at",
      label: "Check out",
      render: (row) => (
        <input
          type="time"
          value={attendanceMap[row.staff_id]?.check_out_at || ""}
          onChange={(event) => updateRecord(row.staff_id, "check_out_at", event.target.value)}
        />
      ),
    },
    {
      key: "remarks",
      label: "Remark",
      render: (row) => (
        <input
          type="text"
          value={attendanceMap[row.staff_id]?.remarks || ""}
          onChange={(event) => updateRecord(row.staff_id, "remarks", event.target.value)}
          placeholder="Optional"
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Staff Attendance"
        subtitle="Record daily attendance for active staff in the current school."
        action={(
          <button type="button" onClick={saveAttendance} disabled={saving || roster.length === 0}>
            {saving ? "Saving..." : "Save attendance"}
          </button>
        )}
      />

      <div className="attendance-controls">
        <label>
          Attendance date
          <input
            type="date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
          />
        </label>
        <div className="attendance-actions">
          {STATUS_OPTIONS.map((status) => (
            <button key={status} type="button" onClick={() => markAll(status)}>
              Mark all {status}
            </button>
          ))}
        </div>
      </div>

      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}

      <div className="attendance-summary">
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className="attendance-summary-card">
            <span>{status}</span>
            <strong>{summary[status]}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading active staff roster..." />
      ) : roster.length === 0 ? (
        <EmptyState
          title="No active staff found"
          message="Add active staff records before recording daily attendance."
        />
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(roster) ? roster : []}
          emptyMessage="No active staff found for this school."
        />
      )}
    </div>
  );
}
