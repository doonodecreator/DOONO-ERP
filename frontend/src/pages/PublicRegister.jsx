import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function PublicRegister() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        admin_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        role: "proprietor",
    });

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await api.post("/register", formData);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            navigate("/add-school");

        } catch (err) {
            setError(
                err.message ||
                "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: "100%",
        padding: "12px",
        marginTop: "6px",
        background: "#0f172a",
        color: "#fff",
        border: "1px solid #334155",
        borderRadius: "8px",
        boxSizing: "border-box",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#090d16",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: 600,
                    background: "#1e293b",
                    padding: 35,
                    borderRadius: 16,
                    color: "#fff",
                }}
            >
                <h2>Create Organization</h2>

                {error && (
                    <div
                        style={{
                            color: "#ffb4b4",
                            marginBottom: 20,
                        }}
                    >
                        {error}
                    </div>
                )}

                <label>Organization Name</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Organization Code
                </label>
                <input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Administrator Name
                </label>
                <input
                    name="admin_name"
                    value={formData.admin_name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Phone
                </label>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Password
                </label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <label style={{ marginTop: 15, display: "block" }}>
                    Confirm Password
                </label>
                <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        marginTop: 25,
                        padding: 14,
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: "bold",
                    }}
                >
                    {loading
                        ? "Creating Organization..."
                        : "Continue"}
                </button>
            </form>
        </div>
    );
}
