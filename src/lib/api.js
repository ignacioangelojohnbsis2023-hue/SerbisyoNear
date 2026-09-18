const configuredApiUrl = typeof import.meta !== "undefined" ? import.meta.env.VITE_API_URL : "";
const apiHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const normalizedHost = apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost;

export const API_BASE_URL = (configuredApiUrl || `http://${normalizedHost}:8010`).replace(/\/$/, "");
export const API_BASE_URL_CANDIDATES = Array.from(
  new Set([API_BASE_URL, `http://${normalizedHost}:8010`, "http://127.0.0.1:8010", "http://localhost:8010"])
);