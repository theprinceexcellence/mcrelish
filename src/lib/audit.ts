import { api } from "./api";

/**
 * Best-effort audit trail for admin/staff actions. Never throws: a failed
 * log line must not block the action it describes.
 */
export async function logAudit(action: string, details: Record<string, unknown> = {}) {
  try {
    await api("/api/admin/audit", { body: { action, details } });
  } catch {
    // logging is best-effort
  }
}
