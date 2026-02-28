const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function apiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL;
  let base = (v && v.trim()) ? v.trim() : DEFAULT_API_BASE_URL;
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  return base.replace(/\/$/, "");
}

