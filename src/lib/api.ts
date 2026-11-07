/** Address of the PHP backend (the folder served from backend/public). Set VITE_API_URL in .env. */
export const API_URL = String(import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:8080").replace(/\/+$/, "");

const TOKEN_KEY = "mcrelish-session";
export const AUTH_EXPIRED_EVENT = "mcrelish-auth-expired";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; form?: FormData };

/** Calls the PHP backend. Errors carry the server's customer-friendly message. */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body !== undefined || options.form ? "POST" : "GET"),
      headers,
      ...(options.form ? { body: options.form } : options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new ApiError("We could not reach the McRelish server. Please check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || data === null) {
    if (res.status === 401 && token && typeof window !== "undefined") {
      setToken(null);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(data?.error ?? "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const menuImageUrl = (path: string) => `${API_URL}/uploads/menu/${encodeURIComponent(path)}`;
export const promoImageUrl = (path: string) => `${API_URL}/uploads/promo/${encodeURIComponent(path)}`;

/** Uploads an image for the menu or the home banner and returns the stored file name. */
export async function uploadImage(kind: "menu" | "promo", file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  return (await api<{ path: string }>(`/api/admin/uploads/${kind}`, { form })).path;
}

export type Role = "admin" | "staff" | "dispatcher";
export type SessionUser = { id: string; email: string; full_name: string; phone: string; roles: Role[] };
