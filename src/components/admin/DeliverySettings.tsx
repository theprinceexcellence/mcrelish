import { useEffect, useId, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useConfirm } from "@/components/ConfirmProvider";
import { logAudit } from "@/lib/audit";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState, Field, PageHeader, Panel, Pill, SkeletonRows, fieldClass } from "./ui";

type Zone = { id: string; name: string; fee: number; active: boolean; created_at: string };
type Store = { id: number; store_open: boolean; note: string; updated_at: string };

function audit(action: string, details: Record<string, unknown>) {
  void logAudit(action, details).catch(() => {});
}

function DeliveryZoneRow({
  zone,
  onUpdate,
  onDelete,
}: {
  zone: Zone;
  onUpdate: (zone: Zone) => void;
  onDelete: (id: string) => void;
}) {
  const id = useId();
  const [fee, setFee] = useState(String(zone.fee));
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFee(String(zone.fee));
  }, [zone.fee]);

  async function update(patch: { fee?: number; active?: boolean }) {
    setBusy(true);
    try {
      const data = await api<Zone>(`/api/admin/zones/${encodeURIComponent(zone.id)}`, {
        method: "PATCH",
        body: patch,
      });
      onUpdate(data);
      if (patch.fee !== undefined) {
        audit("delivery_zone_fee_changed", {
          id: zone.id,
          name: zone.name,
          from: zone.fee,
          to: patch.fee,
        });
      } else {
        audit("delivery_zone_status", { id: zone.id, active: patch.active });
      }
      toast.success("Delivery area updated");
    } catch {
      toast.error("Could not update delivery area");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: `Delete delivery area "${zone.name}"?`,
      description: "Customers will no longer be able to choose it at checkout.",
      confirmLabel: "Delete area",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/api/admin/zones/${encodeURIComponent(zone.id)}`, { method: "DELETE" });
      onDelete(zone.id);
      audit("delivery_zone_removed", { id: zone.id, name: zone.name });
      toast.success("Delivery area removed");
    } catch {
      toast.error("Could not delete delivery area");
    } finally {
      setBusy(false);
    }
  }

  const dirty = Number(fee) !== zone.fee;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-40 flex-1">
        <p className="font-medium">{zone.name}</p>
        <p className="text-xs text-muted-foreground">Currently {formatNaira(zone.fee)}</p>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(fee);
          if (!fee.trim() || !Number.isFinite(value) || value < 0) {
            toast.error("Enter a valid, non-negative fee");
            return;
          }
          void update({ fee: value });
        }}
      >
        <label htmlFor={`${id}-fee`} className="sr-only">
          Delivery fee for {zone.name} (₦)
        </label>
        <div className="relative w-32">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground"
          >
            ₦
          </span>
          <input
            id={`${id}-fee`}
            className={`${fieldClass} pl-7`}
            type="number"
            min="0"
            step="0.01"
            required
            value={fee}
            disabled={busy}
            onChange={(event) => setFee(event.target.value)}
          />
        </div>
        <Button type="submit" variant={dirty ? "default" : "outline"} disabled={busy || !dirty}>
          Save
        </Button>
      </form>

      <label htmlFor={`${id}-active`} className="flex items-center gap-2 text-sm">
        <Switch
          id={`${id}-active`}
          checked={zone.active}
          disabled={busy}
          onCheckedChange={(active) => void update({ active })}
        />
        <span className={zone.active ? "" : "text-muted-foreground"}>
          {zone.active ? "Active" : "Paused"}
        </span>
      </label>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${zone.name}`}
        disabled={busy}
        onClick={() => void remove()}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

export function DeliverySettings() {
  const id = useId();
  const [store, setStore] = useState<Store | null>(null);
  const [note, setNote] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const settings = await api<{ store: Store; zones: Zone[] }>("/api/admin/delivery");
        if (!cancelled) {
          setStore(settings.store);
          setNote(settings.store.note);
          setZones(settings.zones);
        }
      } catch {
        if (!cancelled) setError("Could not load delivery settings. Please reload.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStore(patch: { store_open?: boolean; note?: string }) {
    setSavingStore(true);
    try {
      const data = await api<Store>("/api/admin/store", { body: patch });
      setStore(data);
      if (patch.store_open !== undefined) {
        audit("store_status", { store_open: patch.store_open });
      } else {
        audit("store_note", {});
      }
      toast.success("Store settings saved");
    } catch {
      toast.error("Could not save store settings");
    } finally {
      setSavingStore(false);
    }
  }

  async function addZone() {
    const value = Number(fee);
    if (!name.trim() || !fee.trim() || !Number.isFinite(value) || value < 0) {
      toast.error("Enter an area name and a valid, non-negative fee");
      return;
    }

    setAdding(true);
    try {
      const data = await api<Zone>("/api/admin/zones", { body: { name: name.trim(), fee: value } });
      setZones((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setFee("");
      audit("delivery_zone_added", { id: data.id, name: data.name, fee: data.fee });
      toast.success("Delivery area added");
    } catch {
      toast.error("Could not add delivery area");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <SkeletonRows rows={2} className="h-44" />;
  if (error)
    return (
      <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );

  const open = store?.store_open ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery and settings"
        description="Control whether customers can order and where you deliver."
      />

      <Panel title="Store status" id={`${id}-store-heading`}>
        <div
          className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${open ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
        >
          <div>
            <label htmlFor={`${id}-open`} className="block font-semibold">
              {open ? "Open for online orders" : "Ordering is paused"}
            </label>
            <p role="status" className="text-sm opacity-80">
              {open
                ? "Customers can place orders now."
                : "Customers see a closed message at checkout."}
            </p>
          </div>
          <Switch
            id={`${id}-open`}
            checked={open}
            disabled={savingStore || !store}
            aria-label="Store open for online orders"
            onCheckedChange={(store_open) => void updateStore({ store_open })}
          />
        </div>
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void updateStore({ note });
          }}
        >
          <Field
            label="Store note"
            htmlFor={`${id}-note`}
            hint="Shown to customers, for example holiday hours."
            className="min-w-56 flex-1"
          >
            <input
              id={`${id}-note`}
              className={fieldClass}
              value={note}
              disabled={savingStore}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <Button
            type="submit"
            className="mb-6"
            disabled={savingStore || !store || note === store.note}
          >
            Save note
          </Button>
        </form>
      </Panel>

      <Panel
        title="Delivery areas"
        description="Customers pick one of the active areas at checkout."
        id={`${id}-areas-heading`}
      >
        <form
          className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void addZone();
          }}
        >
          <Field label="Area name" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              className={fieldClass}
              value={name}
              required
              disabled={adding}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Awka Central"
            />
          </Field>
          <Field label="Fee (₦)" htmlFor={`${id}-new-fee`}>
            <input
              id={`${id}-new-fee`}
              className={fieldClass}
              type="number"
              min="0"
              step="0.01"
              value={fee}
              required
              disabled={adding}
              onChange={(event) => setFee(event.target.value)}
              placeholder="0"
            />
          </Field>
          <Button type="submit" className="h-10" disabled={adding}>
            {adding ? "Adding…" : "Add area"}
          </Button>
        </form>

        <div className="mt-5 border-t border-border pt-5">
          {zones.length === 0 ? (
            <EmptyState icon={MapPin} title="No delivery areas yet">
              Add your first area above. Until then, customers can only choose pickup.
            </EmptyState>
          ) : (
            <>
              <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                {zones.length} {zones.length === 1 ? "area" : "areas"}
                <Pill tone="success">{zones.filter((z) => z.active).length} active</Pill>
              </p>
              <ul className="divide-y divide-border">
                {zones.map((zone) => (
                  <DeliveryZoneRow
                    key={zone.id}
                    zone={zone}
                    onUpdate={(updated) =>
                      setZones((current) =>
                        current.map((item) => (item.id === updated.id ? updated : item)),
                      )
                    }
                    onDelete={(zoneId) =>
                      setZones((current) => current.filter((item) => item.id !== zoneId))
                    }
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
