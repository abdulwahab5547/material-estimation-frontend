import axios from "axios";

// Base URL for the backend. Leave VITE_API_URL unset in dev so requests stay
// same-origin and hit the Vite proxy (see vite.config.ts). In prod, set it to
// the backend's origin (no trailing /api — call sites already include it).
const baseURL = import.meta.env.VITE_API_URL ?? "/";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isAuthEndpoint = typeof original?.url === "string" && original.url.includes("/api/auth/");

    if (status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        refreshing ??= api.post("/api/auth/refresh").then(() => undefined);
        await refreshing;
        refreshing = null;
        return api.request(original);
      } catch (e) {
        refreshing = null;
        throw e;
      }
    }
    throw error;
  },
);
