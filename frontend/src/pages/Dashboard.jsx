import { useEffect, useState } from "react";
import api from "../services/api";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUsers,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/dashboard");

      setStats({
        students: data.students ?? 0,
        teachers: data.staff ?? 0,
        parents: data.parents ?? 0,
        revenue: data.payments_received ?? 0,
      });
    } catch (err) {
      console.log("Dashboard Error:", err);

      const message =
        err?.message ||
        err?.error ||
        JSON.stringify(err);

      alert(message);

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: "Students",
      value: stats.students,
      color: "#2563eb",
      icon: <FaUserGraduate size={35} />,
    },
    {
      title: "Teachers",
      value: stats.teachers,
      color: "#16a34a",
      icon: <FaChalkboardTeacher size={35} />,
    },
    {
      title: "Parents",
      value: stats.parents,
      color: "#9333ea",
      icon: <FaUsers size={35} />,
    },
    {
      title: "Revenue",
      value: `₦${Number(stats.revenue).toLocaleString()}`,
      color: "#ea580c",
      icon: <FaMoneyBillWave size={35} />,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2 style={{ color: "red" }}>Dashboard Error</h2>

        <pre
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
            color: "#b91c1c",
          }}
        >
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to DONO ERP</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 20,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#fff",
              padding: 25,
              borderRadius: 20,
            }}
          >
            <div style={{ color: card.color }}>{card.icon}</div>

            <h3>{card.title}</h3>

            <h1>{card.value}</h1>
          </div>
        ))}
      </div>
    </div>
  );
}
