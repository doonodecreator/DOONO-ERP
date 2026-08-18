import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

import {
  FaBuilding,
  FaSchool,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaLayerGroup,
  FaProjectDiagram,
  FaMoneyBillWave,
  FaWallet,
  FaClock,
  FaCheckCircle,
  FaClipboardCheck,
  FaFileAlt,
  FaChartLine,
} from "react-icons/fa";

import "../styles/dashboard.css";

export default function Dashboard() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = getPrimaryRoleSlug({
    roles,
    isPlatformAdmin,
    isOrganizationOwner,
    school,
  });

  const isSuperAdmin =
    userRole === "super_admin" || stats?.dashboard_type === "super_admin";

  const isSchoolAdmin = [
    "proprietor",
    "principal",
    "vice_principal_academic",
    "vice_principal_admin",
    "bursar",
  ].includes(userRole);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");
      const data = response?.data?.data || response?.data || {};
      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        err?.message ||
        err?.data?.message ||
        "Unable to load dashboard metrics. Please check your network or backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: "Organizations",
      value: stats?.organizations,
      icon: <FaBuilding />,
      color: "#1d4ed8",
      show: isSuperAdmin,
    },
    {
      title: "Schools",
      value: stats?.schools,
      icon: <FaSchool />,
      color: "#2563eb",
      show: isSuperAdmin,
    },
    {
      title: "Students",
      value: stats?.students,
      icon: <FaUserGraduate />,
      color: "#0f766e",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Staff",
      value: stats?.staff,
      icon: <FaChalkboardTeacher />,
      color: "#16a34a",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Parents",
      value: stats?.parents,
      icon: <FaUsers />,
      color: "#9333ea",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Subjects",
      value: stats?.subjects,
      icon: <FaBook />,
      color: "#ea580c",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Classes",
      value: stats?.classes,
      icon: <FaLayerGroup />,
      color: "#0f766e",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Streams",
      value: stats?.streams,
      icon: <FaProjectDiagram />,
      color: "#475569",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Fee Categories",
      value: stats?.fee_categories,
      icon: <FaMoneyBillWave />,
      color: "#b45309",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Student Fees",
      value: stats?.student_fees,
      icon: <FaWallet />,
      color: "#dc2626",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Pending Fees",
      value: stats?.pending_fees,
      icon: <FaClock />,
      color: "#ca8a04",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Partial Fees",
      value: stats?.partial_fees,
      icon: <FaClipboardCheck />,
      color: "#0891b2",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Paid Fees",
      value: stats?.paid_fees,
      icon: <FaCheckCircle />,
      color: "#16a34a",
      show: isSuperAdmin || isSchoolAdmin,
    },
    {
      title: "Examinations",
      value: stats?.examinations,
      icon: <FaFileAlt />,
      color: "#7c3aed",
      show: true,
    },
    {
      title: "Attendance",
      value: stats?.attendance_records,
      icon: <FaChartLine />,
      color: "#1e40af",
      show: true,
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#64748b", fontWeight: "500" }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error" style={{ padding: "30px", textAlign: "center" }}>
        <p style={{ color: "#dc2626", fontWeight: "600", marginBottom: "15px" }}>{error}</p>
        <button
          onClick={loadDashboard}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            padding: "8px 18px",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>DONO School ERP</h1>
          <p>
            {isSuperAdmin
              ? "Software Owner / Platform Administrator Dashboard"
              : isSchoolAdmin
              ? "School Administrator Dashboard"
              : `${userRole.replace(/_/g, " ").toUpperCase()} Dashboard`}
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards
          .filter((card) => card.show)
          .map((card) => (
            <div key={card.title} className="dashboard-card">
              <div className="dashboard-card-top">
                <div
                  className="dashboard-card-icon"
                  style={{ background: card.color }}
                >
                  {card.icon}
                </div>
              </div>

              <div className="dashboard-card-title">{card.title}</div>

              <div className="dashboard-card-value">
                {Number(card.value ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
      </div>

      {(isSuperAdmin || isSchoolAdmin) && (
        <div className="dashboard-two-columns">
          <div className="dashboard-section">
            <h2>Finance Summary</h2>

            <div className="dashboard-list">
              <div className="dashboard-list-item">
                <span>Payments Received</span>
                <strong>
                  ₦{Number(stats?.payments_received ?? 0).toLocaleString()}
                </strong>
              </div>

              <div className="dashboard-list-item">
                <span>Outstanding Fees</span>
                <strong>
                  ₦{Number(stats?.outstanding_fees ?? 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>System & Access Status</h2>

            <div className="dashboard-list">
              <div className="dashboard-list-item">
                <span>Your Active Role</span>
                <span className="dashboard-badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
                  {isSuperAdmin ? "Software Owner" : userRole.replace(/_/g, " ")}
                </span>
              </div>

              <div className="dashboard-list-item">
                <span>System Health</span>
                <span className="dashboard-badge" style={{ background: "#dcfce7", color: "#166534" }}>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
