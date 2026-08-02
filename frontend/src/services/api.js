const API_BASE = import.meta.env?.VITE_API_BASE_URL || "https://doono-erp-production.up.railway.app/api/v1";

function getToken() {
    return localStorage.getItem("token");
}

function getSchoolId() {
    const storedSchoolId = localStorage.getItem("school_id");
    if (storedSchoolId) return storedSchoolId;

    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user?.school_id || user?.school?.id || null;
    } catch (e) {
        return null;
    }
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const schoolId = getSchoolId();

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (schoolId) {
        headers["X-School-Id"] = schoolId;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    let data = {};

    try {
        data = await response.json();
    } catch (e) {
        data = {};
    }

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("school_id");
    }

    if (!response.ok) {
        throw data;
    }

    return {
        data,
        status: response.status,
    };
}

export default {
    get(endpoint) {
        return request(endpoint);
    },

    post(endpoint, body) {
        return request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body) {
        return request(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    delete(endpoint) {
        return request(endpoint, {
            method: "DELETE",
        });
    },
};
