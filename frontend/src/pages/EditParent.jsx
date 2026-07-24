import { useState } from "react";
import api from "../services/api";

export default function EditParent({
  parent,
  setPage,
  setSelectedParent,
}) {
  const [form, setForm] =
    useState({
      father_name:
        parent?.father_name || "",
      father_phone:
        parent?.father_phone || "",
      father_email:
        parent?.father_email || "",
      father_occupation:
        parent?.father_occupation || "",

      mother_name:
        parent?.mother_name || "",
      mother_phone:
        parent?.mother_phone || "",
      mother_email:
        parent?.mother_email || "",
      mother_occupation:
        parent?.mother_occupation || "",

      guardian_name:
        parent?.guardian_name || "",
      guardian_phone:
        parent?.guardian_phone || "",
      guardian_email:
        parent?.guardian_email || "",
      guardian_occupation:
        parent?.guardian_occupation || "",
      guardian_relationship:
        parent?.guardian_relationship || "",

      address:
        parent?.address || "",
    });

  const [loading,
    setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response =
        await api.put(
          `/parents/${parent.id}`,
          form
        );

      setSelectedParent(
        response.data.data
      );

      alert(
        "Parent updated successfully."
      );

      setPage(
        "parent-profile"
      );
    } catch (error) {
      console.log(error);
      alert(
        "Failed to update parent."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        style={{
          marginBottom: "20px",
        }}
      >
        Edit Parent
      </h1>

      <form
        onSubmit={submit}
        style={{
          background:
            "#fff",
          padding: "30px",
          borderRadius:
            "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <input
          name="father_name"
          value={
            form.father_name
          }
          onChange={
            handleChange
          }
          placeholder="Father Name"
          style={input}
        />

        <input
          name="father_phone"
          value={
            form.father_phone
          }
          onChange={
            handleChange
          }
          placeholder="Father Phone"
          style={input}
        />

        <input
          name="father_email"
          value={
            form.father_email
          }
          onChange={
            handleChange
          }
          placeholder="Father Email"
          style={input}
        />

        <input
          name="mother_name"
          value={
            form.mother_name
          }
          onChange={
            handleChange
          }
          placeholder="Mother Name"
          style={input}
        />

        <input
          name="mother_phone"
          value={
            form.mother_phone
          }
          onChange={
            handleChange
          }
          placeholder="Mother Phone"
          style={input}
        />

        <textarea
          name="address"
          value={
            form.address
          }
          onChange={
            handleChange
          }
          placeholder="Address"
          style={{
            ...input,
            height: "120px",
          }}
        />

        <button
          disabled={loading}
          style={{
            background:
              "#2563eb",
            color: "#fff",
            border: "none",
            padding:
              "15px 25px",
            borderRadius:
              "12px",
            cursor:
              "pointer",
          }}
        >
          {loading
            ? "Updating..."
            : "Update Parent"}
        </button>
      </form>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "15px",
  marginBottom: "15px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "10px",
};
