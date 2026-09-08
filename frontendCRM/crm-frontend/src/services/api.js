import axios from "axios";

// Clean base URL extraction safely resolving ending slashes
const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:1000/api";
const cleanBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const api = axios.create({
    baseURL: cleanBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("[AUTH EXPIRED] Clearing session and redirecting to login.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;