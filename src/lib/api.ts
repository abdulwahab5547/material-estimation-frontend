import axios from "axios";

export const api = axios.create({
  baseURL: "/",
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
