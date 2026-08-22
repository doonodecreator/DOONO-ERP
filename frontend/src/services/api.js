import axios from "axios";

/*
|--------------------------------------------------------------------------
| DONO SCHOOL ERP API
|--------------------------------------------------------------------------
| The API origin is configurable for Railway, local testing, or a shared tunnel.
|
| Prefer VITE_API_URL for separate frontend/backend deployments; leave it empty
| when the frontend and Laravel API share the same origin.
|
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" && window.__DOONO_API_URL__) ||
    "/api/v1";

const api = axios.create({
    baseURL: API_URL,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },

    timeout: 30000,
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
| Automatically attaches the logged-in user's Sanctum token.
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
            config.headers = config.headers || {};
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        /*
        |--------------------------------------------------------------------------
        | NETWORK ERROR
        |--------------------------------------------------------------------------
        | No response means the browser could not communicate with
        | the configured Laravel API origin.
        |--------------------------------------------------------------------------
        */

        if (!error.response) {
            const networkError = new Error(
                `Unable to connect to the DOONO De Creator ERP API at ${API_URL}. ` +
                "Check the backend URL, tunnel, or network connection."
            );

            networkError.code = error.code || "NETWORK_ERROR";
            networkError.isNetworkError = true;
            networkError.originalError = error;

            return Promise.reject(networkError);
        }

        const status = error.response.status;
        const data = error.response.data || {};

        /*
        |--------------------------------------------------------------------------
        | 401 - UNAUTHORIZED
        |--------------------------------------------------------------------------
        */

        if (status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        /*
        |--------------------------------------------------------------------------
        | BACKEND MESSAGE
        |--------------------------------------------------------------------------
        */

        if (data.message) {
            error.message = data.message;
        }

        if (data.requires_subscription || data.requested_feature) {
            error.requiresSubscription = true;
            error.requestedFeature = data.requested_feature || null;
            error.requestedFeatureLabel = data.requested_feature_label || null;
            error.currentPlan = data.current_plan || null;
            error.upgradeUrl = data.upgrade_url || "/dashboard/subscription/upgrade";
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("dono:subscription-required", {
                    detail: {
                        feature: data.requested_feature_label || data.requested_feature || "This feature",
                        message: data.message,
                    },
                }));
            }
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATION ERRORS
        |--------------------------------------------------------------------------
        */

        if (data.errors) {
            error.errors = data.errors;
        }

        /*
        |--------------------------------------------------------------------------
        | 403 - FORBIDDEN
        |--------------------------------------------------------------------------
        */

        if (status === 403) {
            error.forbidden = true;

            if (!data.message) {
                error.message =
                    "You do not have permission to perform this action.";
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 404 - NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (status === 404) {
            error.notFound = true;

            if (!data.message) {
                error.message =
                    "The requested resource was not found.";
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 422 - VALIDATION ERROR
        |--------------------------------------------------------------------------
        */

        if (status === 422) {
            error.validationError = true;

            if (!data.message) {
                error.message =
                    "Please check the information entered and try again.";
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 500+ - SERVER ERROR
        |--------------------------------------------------------------------------
        */

        if (status >= 500) {
            error.serverError = true;

            if (!data.message) {
                error.message =
                    "The DONO School ERP server encountered an error.";
            }
        }

        error.status = status;
        error.responseData = data;

        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| API INFORMATION
|--------------------------------------------------------------------------
*/

export const getApiBaseUrl = () => API_URL;

export const resolveMediaUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    if (/^(blob:|data:)/i.test(value)) return value;

    const browserOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const configuredApiUrl = new URL(API_URL, browserOrigin);
    const mediaUrl = new URL(value, browserOrigin);
    const isLocalPlaceholder = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(mediaUrl.hostname);
    const isStoragePath = mediaUrl.pathname.startsWith("/storage/");

    // APP_URL is often left as localhost during local/tunnel testing. The browser
    // can reach the API origin, not the backend machine's localhost address.
    if (isLocalPlaceholder || (isStoragePath && configuredApiUrl.origin !== browserOrigin && !/^https?:\/\//i.test(value))) {
        mediaUrl.protocol = configuredApiUrl.protocol;
        mediaUrl.host = configuredApiUrl.host;
    }

    return mediaUrl.toString();
};

export default api;
