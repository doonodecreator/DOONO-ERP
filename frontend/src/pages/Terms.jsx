import { useEffect, useState } from "react";
import api from "../services/api";

export default function Terms() {
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [form, setForm] = useState({
    academic_session_id: "",
    name: "",
    start_date: "",
    end_date: "",
    is_current: true,
    status: "active",
  });

  useEffect(() => {
    loadTerms();
    loadSessions();
  }, []);

  const loadTerms = async () => {
    try {
      const res = await api.get("/terms");
      setTerms(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

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
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const saveTerm = async (e) => {
    e.preventDefault();

    try {
      await api.post("/terms", form);

      alert("Term saved successfully.");

      setForm({
        academic_session_id: "",
        name: "",
        start_date: "",
        end_date: "",
        is_current: true,
        status: "active",
      });

      loadTerms();

    } catch (err) {

      console.log(err);

      if (err.response?.data?.errors) {
        alert(
          JSON.stringify(
            err.response.data.errors,
            null,
            2
          )
        );
      } else {
        alert("Unable to save term.");
      }
    }
  };

  return (
    <div>

      <h1>Terms</h1>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      >

        <h3>Add New Term</h3>

        <form onSubmit={saveTerm}>

          <select
            name="academic_session_id"
            value={form.academic_session_id}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">
              Select Academic Session
            </option>

            {sessions.map((session) => (
              <option
                key={session.id}
                value={session.id}
              >
                {session.name}
              </option>
            ))}

          </select>

          <select
            name="name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          >

            <option value="">
              Select Term
            </option>

            <option value="First Term">
              First Term
            </option>

            <option value="Second Term">
              Second Term
            </option>

            <option value="Third Term">
              Third Term
            </option>

          </select>

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

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={inputStyle}
          >

            <option value="active">
              Active
            </option>

            <option value="closed">
              Closed
            </option>

          </select>

          <label>

            <input
              type="checkbox"
              name="is_current"
              checked={form.is_current}
              onChange={handleChange}
            />

            Current Term

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
              cursor: "pointer",
            }}
          >
            Save Term
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

              <th>Academic Session</th>

              <th>Term</th>

              <th>Start</th>

              <th>End</th>

              <th>Current</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {terms.map((term) => (

              <tr key={term.id}>

                <td>
                  {term.academic_session?.name}
                </td>

                <td>
                  {term.name}
                </td>

                <td>
                  {term.start_date}
                </td>

                <td>
                  {term.end_date}
                </td>

                <td>

                  {term.is_current ? (
                    <span
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      Current
                    </span>
                  ) : (
                    "-"
                  )}

                </td>

                <td>

                  <span
                    style={{
                      background:
                        term.status === "active"
                          ? "#2563eb"
                          : "#64748b",
                      color: "#fff",
                      padding: "5px 10px",
                      borderRadius: "8px",
                    }}
                  >
                    {term.status}
                  </span>

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
