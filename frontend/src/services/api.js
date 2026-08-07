import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://127.0.0.1:8000/api/v1",

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login";
        }

        // Normalize err.message to the backend's real message when present,
        // so every caller across the app gets useful error text via
        // err.message instead of Axios's generic "Request failed with
        // status code 422" — fixed once here, not per-page.
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        // Surface field-level validation errors the same way everywhere —
        // err.errors, so pages can show them under the right input without
        // reaching into err.response.data.errors themselves.
        if (error.response?.data?.errors) {
            error.errors = error.response.data.errors;
        }

        return Promise.reject(error);
    }
);

export default api;
