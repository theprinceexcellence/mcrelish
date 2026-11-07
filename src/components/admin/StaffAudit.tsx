import { useCallback, useEffect, useId, useRef, useState } from "react";
import { History, RefreshCw, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useConfirm } from "@/components/ConfirmProvider";
import { listStaff, addStaffRole, removeStaffRole } from "@/lib/staff.functions";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Pill,
  SkeletonRows,
  fieldClass,
  initials,
} from "./ui";

type Role = "admin" | "staff" | "dispatcher";
type Staff = {
  user_id: string;
  email: string;
  roles: Role[];
};
type AuditRow = {
  id: string;
  actor_email: string;
  action: string;
  details: unknown;
  created_at: string;
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  staff: "Food Hub Staff",
  dispatcher: "Delivery Dispatch",
};

const roleInfo: { role: Role; blurb: string }[] = [
  { role: "admin", blurb: "Everything, including staff, sales and settings." },
  { role: "staff", blurb: "Live orders and the menu." },
  { role: "dispatcher", blurb: "Live orders only." },
];

const roleTone = { admin: "primary", staff: "warning", dispatcher: "neutral" } as const;

const actionLabels: Record<string, string> = {
  order_status: "Changed an order status",
  price_change: "Changed a price",
  menu_edit: "Edited the menu",
  menu_reorder: "Reordered the menu",
  menu_stock: "Updated a stock warning",
  home_banner: "Updated the home banner",
  store_status: "Opened or closed the store",
  store_note: "Updated the store note",
  delivery_zone_added: "Added a delivery area",
  delivery_zone_removed: "Removed a delivery area",
  delivery_zone_fee_changed: "Changed a delivery fee",
  delivery_zone_status: "Paused or resumed a delivery area",
  staff_role_added: "Added a staff role",
  staff_role_removed: "Removed a staff role",
};

const lagosTime = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  dateStyle: "medium",
  timeStyle: "short",
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function detailsSummary(details: unknown) {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details as Record<string, unknown>)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
    .join(" · ");
}

export function StaffAudit() {
  const id = useId();
  const confirm = useConfirm();
  const mounted = useRef(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [busy, setBusy] = useState(false);

  const loadStaff = useCallback(async () => {
    if (mounted.current) {
      setLoadingStaff(true);
      setStaffError(null);
    }
    try {
      const result = await listStaff();
      if (mounted.current) setStaff(result.staff);
    } catch (error) {
      if (mounted.current) {
        setStaffError(errorMessage(error, "Could not load staff"));
      }
    } finally {
      if (mounted.current) setLoadingStaff(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    if (mounted.current) {
      setLoadingLogs(true);
      setLogsError(null);
    }
    try {
      const { logs: data } = await api<{ logs: AuditRow[] }>("/api/admin/audit?limit=50");
      if (mounted.current) setLogs(data);
    } catch (error) {
      if (mounted.current) {
        setLogsError(errorMessage(error, "Could not load activity log"));
      }
    } finally {
      if (mounted.current) setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadStaff();
    void loadLogs();
    return () => {
      mounted.current = false;
    };
  }, [loadStaff, loadLogs]);

  function record(action: string, details: Record<string, unknown>) {
    void logAudit(action, details)
      .then(() => {
        if (mounted.current) void loadLogs();
      })
      .catch(() => {});
  }

  async function addRole() {
    const address = email.trim();
    if (!address) {
      toast.error("Enter an email address");
      return;
    }

    setBusy(true);
    try {
      await addStaffRole({ data: { email: address, role } });
      record("staff_role_added", { email: address, role });
      toast.success("Staff role added");
      setEmail("");
      await loadStaff();
    } catch (error) {
      toast.error(errorMessage(error, "Could not add staff role"));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function removeRole(person: Staff, selectedRole: Role) {
    const ok = await confirm({
      title: `Remove ${roleLabels[selectedRole]} access from ${person.email}?`,
      description: "They will lose access to those dashboard sections immediately.",
      confirmLabel: "Remove access",
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    try {
      await removeStaffRole({
        data: { userId: person.user_id, role: selectedRole },
      });
      record("staff_role_removed", {
        email: person.email,
        role: selectedRole,
      });
      toast.success("Staff role removed");
      await loadStaff();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove staff role"));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff and activity"
        description="Give your team access and review what changed."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {roleInfo.map((info) => (
          <div key={info.role} className="rounded-xl border border-border bg-card px-4 py-3">
            <Pill tone={roleTone[info.role]}>{roleLabels[info.role]}</Pill>
            <p className="mt-2 text-sm text-muted-foreground">{info.blurb}</p>
          </div>
        ))}
      </div>

      <Panel
        title="Team"
        description="People must create an account on the website before you can add them."
        id={`${id}-staff-heading`}
      >
        <form
          className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void addRole();
          }}
        >
          <Field label="Email" htmlFor={`${id}-email`}>
            <input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              required
              className={fieldClass}
              value={email}
              disabled={busy}
              placeholder="person@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Role" htmlFor={`${id}-role`}>
            <select
              id={`${id}-role`}
              className={fieldClass}
              value={role}
              disabled={busy}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              <option value="admin">Admin</option>
              <option value="staff">Food Hub Staff</option>
              <option value="dispatcher">Delivery Dispatch</option>
            </select>
          </Field>
          <Button type="submit" className="h-10" disabled={busy || loadingStaff}>
            <UserPlus />
            {busy ? "Saving…" : "Add role"}
          </Button>
        </form>

        <div className="mt-5 border-t border-border pt-5">
          {loadingStaff && staff.length === 0 ? (
            <SkeletonRows rows={3} className="h-14" />
          ) : staffError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {staffError}
              <Button type="button" variant="outline" size="sm" onClick={() => void loadStaff()}>
                Retry
              </Button>
            </div>
          ) : staff.length === 0 ? (
            <EmptyState icon={Users} title="No staff roles assigned yet">
              Add someone above to give them dashboard access.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {staff.map((person) => (
                <li
                  key={person.user_id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {initials(person.email)}
                  </span>
                  <p className="min-w-48 flex-1 break-all text-sm font-medium">{person.email}</p>
                  <div className="flex flex-wrap gap-2">
                    {person.roles.map((assignedRole) => (
                      <span
                        key={assignedRole}
                        className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pl-3 pr-1 text-xs font-medium"
                      >
                        {roleLabels[assignedRole]}
                        <button
                          type="button"
                          disabled={busy}
                          className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          aria-label={`Remove ${roleLabels[assignedRole]} role from ${person.email}`}
                          onClick={() => void removeRole(person, assignedRole)}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                    {person.roles.length === 0 && (
                      <span className="text-sm text-muted-foreground">No roles</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel
        title="Activity log"
        description="Latest 50 events, in Lagos time."
        id={`${id}-activity-heading`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingLogs}
            onClick={() => void loadLogs()}
          >
            <RefreshCw className={loadingLogs ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      >
        {loadingLogs && logs.length === 0 ? (
          <SkeletonRows rows={4} className="h-12" />
        ) : logsError ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {logsError}
          </p>
        ) : logs.length === 0 ? (
          <EmptyState icon={History} title="No activity recorded yet">
            Changes made in the dashboard will show up here.
          </EmptyState>
        ) : (
          <ol className="divide-y divide-border">
            {logs.map((entry) => {
              const summary = detailsSummary(entry.details);
              return (
                <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-medium">
                      {actionLabels[entry.action] ?? entry.action}
                    </p>
                    <time dateTime={entry.created_at} className="text-xs text-muted-foreground">
                      {lagosTime.format(new Date(entry.created_at))}
                    </time>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">
                    {entry.actor_email || "Unknown actor"}
                  </p>
                  {summary && <p className="mt-1 break-words text-sm">{summary}</p>}
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Raw details
                    </summary>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-xs">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </details>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}
