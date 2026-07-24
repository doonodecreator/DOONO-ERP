import { useEffect, useState } from "react";
import api from "../services/api";

export default function AcademicSessions() {
  const [sessions, setSessions] = useState([]);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get("/academic-sessions");
      setSessions(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSession = async (e) => {
    e.preventDefault();

    try {
      await api.post("/academic-sessions", form);

      alert("Academic Session saved successfully.");

      setForm({
        name: "",
        start_date: "",
        end_date: "",
        is_active: true,
      });

      loadSessions();
    } catch (err) {
      console.log(err);

      if (err.response?.data?.errors) {
        alert(JSON.stringify(err.response.data.errors, null, 2));
      } else {
        alert("Unable to save Academic Session.");
      }
    }
  };

  return (
    <div>
      <h1>Academic Sessions</h1>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      >
        <h3>Add Academic Session</h3>

        <form onSubmit={saveSession}>
          <input
            name="name"
            placeholder="2026/2027"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />

          <label>Start Date</label>

          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={inputStyle}
          />

          <label>End Date</label>

          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            style={inputStyle}
          />

          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />

            Current Academic Session
          </label>

          <br />
          <br />

          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
            }}
          >
            Save Academic Session
          </button>
        </form>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "20px",
        }}
      >
        <table width="100%">
          <thead>
            <tr>
              <th>Session</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.start_date}</td>
                <td>{item.end_date}</td>
                <td>
                  {item.is_active ? "Current" : "Closed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
};
