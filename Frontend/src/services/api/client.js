import axios from "axios";

/** Empty = same origin (Railway serving UI, or Vite proxy). Set VITE_API_ORIGIN for Vercel→Railway. */
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api/v1` : "/api/v1",
  withCredentials: true,
});

export default api;
