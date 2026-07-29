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

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await api.get("/dashboard");

      const data = response.data;

      setStats({
        students: data.students ?? 0,
        teachers: data.staff ?? 0,
        parents: data.parents ?? 0,
        revenue: data.payments_received ?? 0,
      });
    } catch (err) {
      console.log("Dashboard Error:", err);
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

  return (
    <div>
      <h1>Welcome to DONO ERP</h1>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
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
      )}
    </div>
  );
}
