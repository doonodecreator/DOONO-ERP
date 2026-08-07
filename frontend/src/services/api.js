import axios from "axios";

/*
|--------------------------------------------------------------------------
| DONO SCHOOL ERP API
|--------------------------------------------------------------------------
| Production Laravel backend hosted on Railway.
|
| Do not change this URL unless the Railway backend URL changes.
|
*/

const API_URL =
    "https://doono-erp-production.up.railway.app/api/v1";

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
        | the Railway Laravel backend.
        |--------------------------------------------------------------------------
        */

        if (!error.response) {
            const networkError = new Error(
                "Unable to connect to the DONO School ERP server. " +
                "Please check the Railway backend connection."
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

export default api;
