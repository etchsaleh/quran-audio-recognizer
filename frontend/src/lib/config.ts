const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function apiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = (v && v.trim()) ? v.trim() : DEFAULT_API_BASE_URL;
  return base.replace(/\/$/, "");
}

