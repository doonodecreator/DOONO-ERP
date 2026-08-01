import { useEffect, useState } from "react";
import api from "../services/api";

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
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const response = await api.get("/dashboard");

      setStats(response.data);
    } catch (err) {
      console.log(err);
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: "Organizations",
      value: stats.organizations,
      icon: <FaBuilding />,
      color: "#1d4ed8",
      show: stats.dashboard_type === "super_admin",
    },
    {
      title: "Schools",
      value: stats.schools,
      icon: <FaSchool />,
      color: "#2563eb",
      show: stats.dashboard_type === "super_admin",
    },
    {
      title: "Students",
      value: stats.students,
      icon: <FaUserGraduate />,
      color: "#0f766e",
      show: true,
    },
    {
      title: "Staff",
      value: stats.staff,
      icon: <FaChalkboardTeacher />,
      color: "#16a34a",
      show: true,
    },
    {
      title: "Parents",
      value: stats.parents,
      icon: <FaUsers />,
      color: "#9333ea",
      show: true,
    },
    {
      title: "Subjects",
      value: stats.subjects,
      icon: <FaBook />,
      color: "#ea580c",
      show: true,
    },
    {
      title: "Classes",
      value: stats.classes,
      icon: <FaLayerGroup />,
      color: "#0f766e",
      show: true,
    },
    {
      title: "Streams",
      value: stats.streams,
      icon: <FaProjectDiagram />,
      color: "#475569",
      show: true,
    },
    {
      title: "Fee Categories",
      value: stats.fee_categories,
      icon: <FaMoneyBillWave />,
      color: "#b45309",
      show: true,
    },
    {
      title: "Student Fees",
      value: stats.student_fees,
      icon: <FaWallet />,
      color: "#dc2626",
      show: true,
    },
    {
      title: "Pending Fees",
      value: stats.pending_fees,
      icon: <FaClock />,
      color: "#ca8a04",
      show: true,
    },
    {
      title: "Partial Fees",
      value: stats.partial_fees,
      icon: <FaClipboardCheck />,
      color: "#0891b2",
      show: true,
    },
    {
      title: "Paid Fees",
      value: stats.paid_fees,
      icon: <FaCheckCircle />,
      color: "#16a34a",
      show: true,
    },
    {
      title: "Examinations",
      value: stats.examinations,
      icon: <FaFileAlt />,
      color: "#7c3aed",
      show: true,
    },
    {
      title: "Attendance",
      value: stats.attendance_records,
      icon: <FaChartLine />,
      color: "#1e40af",
      show: true,
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>DONO School ERP</h1>
          <p>
            {stats.dashboard_type === "super_admin"
              ? "Super Administrator Dashboard"
              : "School Dashboard"}
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards
          .filter(card => card.show)
          .map(card => (
            <div
              key={card.title}
              className="dashboard-card"
            >
              <div className="dashboard-card-top">
                <div
                  className="dashboard-card-icon"
                  style={{ background: card.color }}
                >
                  {card.icon}
                </div>
              </div>

              <div className="dashboard-card-title">
                {card.title}
              </div>

              <div className="dashboard-card-value">
                {card.title.includes("Fee") ||
                card.title.includes("Revenue")
                  ? Number(card.value ?? 0).toLocaleString()
                  : card.value ?? 0}
              </div>
            </div>
          ))}
      </div>

      <div className="dashboard-two-columns">

        <div className="dashboard-section">
          <h2>Finance Summary</h2>

          <div className="dashboard-list">

            <div className="dashboard-list-item">
              <span>Payments Received</span>
              <strong>
                ₦{Number(stats.payments_received ?? 0).toLocaleString()}
              </strong>
            </div>

            <div className="dashboard-list-item">
              <span>Outstanding Fees</span>
              <strong>
                ₦{Number(stats.outstanding_fees ?? 0).toLocaleString()}
              </strong>
            </div>

          </div>
        </div>

        <div className="dashboard-section">
          <h2>Status</h2>

          <div className="dashboard-list">

            <div className="dashboard-list-item">
              <span>Dashboard Type</span>
              <span className="dashboard-badge">
                {stats.dashboard_type}
              </span>
            </div>

            <div className="dashboard-list-item">
              <span>System</span>
              <span className="dashboard-badge">
                Online
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
