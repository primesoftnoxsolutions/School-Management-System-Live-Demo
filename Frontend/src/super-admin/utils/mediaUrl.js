/** Empty = same origin (production / Vite proxy). Override with VITE_API_ORIGIN if API is on another host. */
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");

export function resolveStudentPhotoUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_ORIGIN}/api/v1${trimmed}`;
  }
  if (trimmed.startsWith("/api/v1/")) {
    return `${API_ORIGIN}${trimmed}`;
  }
  return trimmed;
}
