const apiHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const normalizedHost = apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost;

export const API_BASE_URL = `http://${normalizedHost}:8010`;
export const API_BASE_URL_CANDIDATES = Array.from(
  new Set([normalizedHost, "127.0.0.1", "localhost"])
).map((host) => `http://${host}:8010`);