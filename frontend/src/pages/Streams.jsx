import { useEffect, useState } from "react";
import api from "../services/api";

export default function Streams() {
  const [streams, setStreams] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState({
    class_id: "",
    name: "",
    code: "",
    display_order: 1,
    is_active: true,
  });

  useEffect(() => {
    loadStreams();
    loadClasses();
  }, []);

  const loadStreams = async () => {
    try {
      const res = await api.get("/streams");
      setStreams(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } =
      e.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const saveStream = async (e) => {
    e.preventDefault();

    try {
      await api.post("/streams", form);

      alert("Stream saved successfully.");

      setForm({
        class_id: "",
        name: "",
        code: "",
        display_order: 1,
        is_active: true,
      });

      loadStreams();
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
        alert("Unable to save stream.");
      }
    }
  };

  return (
    <div>
      <h1>Streams</h1>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      >
        <h3>Add Stream</h3>

        <form onSubmit={saveStream}>
          <select
            name="class_id"
            value={form.class_id}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">
              Select Class
            </option>

            {classes.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <input
            name="name"
            placeholder="Stream Name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="code"
            placeholder="Code"
            value={form.code}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="number"
            name="display_order"
            value={form.display_order}
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
            Active
          </label>

          <br />
          <br />

          <button
            type="submit"
            style={buttonStyle}
          >
            Save Stream
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
              <th>Stream</th>
              <th>Class</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {streams.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>

                <td>
                  {item.class?.name || "-"}
                </td>

                <td>
                  {item.is_active
                    ? "Active"
                    : "Inactive"}
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

const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "10px",
};
