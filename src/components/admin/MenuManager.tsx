import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Search, UtensilsCrossed } from "lucide-react";
import { products as bundledProducts } from "@/data/menu";
import { catalogQuery } from "@/lib/catalog-query";
import { useStore } from "@/lib/store";
import type { MenuItem, MenuSection } from "@/lib/catalog";
import { api, uploadImage } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState, Field, PageHeader, Pill, SkeletonRows, fieldClass } from "./ui";

type MenuPrice = {
  key: string;
  product_name: string;
  label: string;
  price: number;
  available: boolean;
  sort: number;
  low_stock: boolean;
  updated_at: string;
};

function PriceControls({ row, onChange }: { row: MenuPrice; onChange: (row: MenuPrice) => void }) {
  const id = useId();
  const [price, setPrice] = useState(String(row.price));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrice(String(row.price));
  }, [row.price]);

  async function update(patch: Partial<Pick<MenuPrice, "price" | "available" | "low_stock">>) {
    setBusy(true);
    try {
      const data = await api<MenuPrice>("/api/admin/menu/prices", {
        body: { key: row.key, ...patch },
      });
      onChange(data);

      if (patch.price !== undefined) {
        void logAudit("price_change", { label: row.label, from: row.price, to: patch.price }).catch(
          () => {},
        );
        toast.success(`Price saved: ${formatNaira(patch.price)}`);
      } else {
        toast.success("Menu availability updated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update menu item");
    } finally {
      setBusy(false);
    }
  }

  const dirty = Number(price) !== row.price;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-medium">{row.label}</p>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(price);
          if (!price.trim() || !Number.isSafeInteger(value) || value < 0) {
            toast.error("Enter a valid, non-negative price");
            return;
          }
          void update({ price: value });
        }}
      >
        <div className="relative min-w-0 flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground"
          >
            ₦
          </span>
          <input
            id={`${id}-price`}
            type="number"
            min="0"
            step="1"
            required
            value={price}
            disabled={busy}
            onChange={(event) => setPrice(event.target.value)}
            className={`${fieldClass} pl-7`}
            aria-label={`${row.label} price in naira`}
          />
        </div>
        <Button type="submit" size="sm" disabled={busy || !dirty}>
          Save
        </Button>
      </form>
      <label
        htmlFor={`${id}-available`}
        className="flex items-center justify-between gap-3 text-sm"
      >
        Available
        <Switch
          id={`${id}-available`}
          checked={row.available}
          disabled={busy}
          onCheckedChange={(available) => void update({ available })}
        />
      </label>
      <label htmlFor={`${id}-stock`} className="flex items-center justify-between gap-3 text-sm">
        <span>
          Running low <span className="text-xs text-muted-foreground">(warns staff)</span>
        </span>
        <Switch
          id={`${id}-stock`}
          checked={row.low_stock}
          disabled={busy}
          onCheckedChange={(low_stock) => void update({ low_stock })}
        />
      </label>
    </div>
  );
}

type Draft =
  | { kind: "item"; value: MenuItem; isNew: boolean }
  | { kind: "section"; value: MenuSection; isNew: boolean };

export function MenuManager({ canManage = false }: { canManage?: boolean }) {
  const queryClient = useQueryClient();
  const { catalog } = useStore();
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [prices, setPrices] = useState<MenuPrice[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  async function load() {
    let menu: { sections: MenuSection[]; items: MenuItem[]; prices: MenuPrice[] };
    try {
      menu = await api("/api/admin/menu");
    } catch {
      throw new Error("Could not load menu management. Please try again.");
    }
    setSections(menu.sections);
    setItems(menu.items);
    setPrices(menu.prices);
  }
  useEffect(() => {
    void load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function refresh() {
    await load();
    await queryClient.invalidateQueries({ queryKey: catalogQuery.queryKey });
  }
  function edit(value: Draft) {
    setPhoto(null);
    setError("");
    setDraft(value);
    setEditorOpen(true);
  }
  function patchDraft(patch: Record<string, string | number | boolean>) {
    setDraft((current) =>
      current ? ({ ...current, value: { ...current.value, ...patch } } as Draft) : null,
    );
  }
  async function save() {
    if (!draft || busy) return;
    if (!draft.value.name.trim()) {
      setError("Enter a name.");
      return;
    }
    if (
      draft.kind === "item" &&
      (!Number.isSafeInteger(draft.value.price) || draft.value.price < 0)
    ) {
      setError("Enter a whole, non-negative price in naira.");
      return;
    }
    if (draft.kind === "item" && draft.isNew && !photo) {
      setError("Choose a photo for the new item.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let imagePath = draft.value.image_path;
      if (photo) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(photo.type) ||
          photo.size > 5 * 1024 * 1024
        )
          throw new Error("Use a JPG, PNG or WebP photo up to 5 MB.");
        imagePath = await uploadImage("menu", photo);
      }
      const value = { ...draft.value, name: draft.value.name.trim(), image_path: imagePath };
      try {
        await api(draft.kind === "item" ? "/api/admin/menu/items" : "/api/admin/menu/sections", {
          body: value,
        });
      } catch (e) {
        throw new Error(
          e instanceof Error
            ? e.message
            : "Could not save. Please check your access and try again.",
        );
      }
      void logAudit("menu_edit", { kind: draft.kind, id: value.id, name: value.name });
      await refresh();
      setEditorOpen(false);
      setPhoto(null);
      toast.success("Menu saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save menu");
    } finally {
      setBusy(false);
    }
  }
  async function setAvailable(item: MenuItem, available: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      await api("/api/admin/menu/items", { body: { ...item, available } });
      void logAudit("menu_edit", { kind: "item", id: item.id, name: item.name, available });
      await refresh();
    } catch {
      toast.error("Could not update availability");
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function setLowStock(item: MenuItem, row: MenuPrice, low_stock: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      await api("/api/admin/menu/prices", { body: { key: row.key, low_stock } });
      void logAudit("menu_stock", { id: item.id, low_stock });
      await load();
    } catch {
      toast.error("Could not update stock warning");
    } finally {
      setBusy(false);
    }
  }
  async function move(
    kind: "section" | "item",
    list: (MenuSection | MenuItem)[],
    index: number,
    delta: number,
  ) {
    const first = list[index];
    const second = list[index + delta];
    if (!first || !second || busy) return;
    setBusy(true);
    try {
      const ordered = [...list];
      ordered[index] = second;
      ordered[index + delta] = first;
      try {
        await api("/api/admin/menu/reorder", { body: { kind, ids: ordered.map((row) => row.id) } });
      } catch {
        throw new Error("Could not reorder menu. Please try again.");
      }
      void logAudit("menu_reorder", { kind, id: first.id, direction: delta });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <SkeletonRows rows={3} className="h-32" />;
  if (error && !sections.length)
    return (
      <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );

  const q = search.trim().toLowerCase();
  const visibleSections = sections.filter((section) => {
    const sectionItems = items.filter((i) => i.section_id === section.id);
    return (
      !q ||
      section.name.toLowerCase().includes(q) ||
      sectionItems.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <section aria-label="Menu management" className="space-y-5">
      <PageHeader
        title="Menu manager"
        description={`${sections.length} sections · ${items.length} items`}
        actions={
          canManage && (
            <Button
              disabled={busy}
              onClick={() =>
                edit({
                  kind: "section",
                  isNew: true,
                  value: {
                    id: crypto.randomUUID(),
                    name: "",
                    subtitle: "",
                    image_path: "",
                    visible: true,
                    sort_order: sections.length,
                  },
                })
              }
            >
              <Plus />
              New section
            </Button>
          )
        }
      />

      <div className="relative max-w-md">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
        />
        <input
          aria-label="Search menu items"
          className={`${fieldClass} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items or sections"
        />
      </div>

      {visibleSections.length === 0 && (
        <EmptyState
          icon={UtensilsCrossed}
          title={q ? "Nothing matches your search" : "Your menu is empty"}
        >
          {q ? "Try a different word." : "Create a section, then add items to it."}
        </EmptyState>
      )}

      <div className="space-y-5">
        {visibleSections.map((section) => {
          const sectionIndex = sections.findIndex((s) => s.id === section.id);
          const sectionItems = items.filter((i) => i.section_id === section.id);
          const shown =
            q && !section.name.toLowerCase().includes(q)
              ? sectionItems.filter((i) => i.name.toLowerCase().includes(q))
              : sectionItems;
          return (
            <section
              key={section.id}
              aria-label={section.name}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-2 break-words text-base font-semibold">
                    {section.name}
                    <span className="text-xs font-normal text-muted-foreground">
                      {sectionItems.length} items
                    </span>
                    {!section.visible && <Pill>Hidden</Pill>}
                  </h3>
                  {section.subtitle && (
                    <p className="mt-0.5 break-words text-sm text-muted-foreground">
                      {section.subtitle}
                    </p>
                  )}
                </div>
                {canManage && (
                  <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move section up"
                      aria-label={`Move ${section.name} section up`}
                      disabled={busy || sectionIndex === 0}
                      onClick={() => void move("section", sections, sectionIndex, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move section down"
                      aria-label={`Move ${section.name} section down`}
                      disabled={busy || sectionIndex === sections.length - 1}
                      onClick={() => void move("section", sections, sectionIndex, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit section"
                      aria-label={`Edit ${section.name} section`}
                      disabled={busy}
                      onClick={() => edit({ kind: "section", value: { ...section }, isNew: false })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        edit({
                          kind: "item",
                          isNew: true,
                          value: {
                            id: crypto.randomUUID(),
                            section_id: section.id,
                            name: "",
                            description: "",
                            image_path: "",
                            price: 0,
                            visible: true,
                            available: true,
                            sort_order: sectionItems.length,
                          },
                        })
                      }
                    >
                      <Plus />
                      Add item
                    </Button>
                  </div>
                )}
              </div>

              <ul className="divide-y divide-border">
                {shown.map((item) => {
                  const itemIndex = sectionItems.findIndex((i) => i.id === item.id);
                  const image =
                    catalog.products.find((p) => p.id === item.id)?.image ??
                    bundledProducts.find((p) => p.id === item.id)?.image;
                  const optionPrices = prices.filter(
                    (p) => !p.key.startsWith("p:") && p.key.split(":")[1] === item.id,
                  );
                  const stockRow = prices.find((p) => p.key === `p:${item.id}`);
                  return (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            className="size-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <ImagePlus className="size-5" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-40 flex-1">
                          <p className="break-words text-sm font-medium">{item.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {!item.visible && <Pill>Hidden</Pill>}
                            {item.visible && !item.available && (
                              <Pill tone="warning">Unavailable</Pill>
                            )}
                            {stockRow?.low_stock && <Pill tone="warning">Running low</Pill>}
                            {optionPrices.length > 0 && <Pill tone="primary">Customizable</Pill>}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatNaira(item.price)}
                        </span>
                        {canManage && stockRow && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-xs"
                            disabled={busy}
                            aria-pressed={stockRow.low_stock}
                            onClick={() => void setLowStock(item, stockRow, !stockRow.low_stock)}
                          >
                            {stockRow.low_stock ? "Clear low stock" : "Mark low stock"}
                          </Button>
                        )}
                        {canManage && (
                          <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              aria-label={`${item.name} available to order`}
                              checked={item.available}
                              disabled={busy}
                              onCheckedChange={(available) => void setAvailable(item, available)}
                            />
                            <span className="hidden sm:inline">
                              {item.available ? "Available" : "Off"}
                            </span>
                          </label>
                        )}
                        {canManage && (
                          <div className="flex shrink-0 gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Move item up"
                              aria-label={`Move ${item.name} up`}
                              disabled={busy || itemIndex === 0 || !!q}
                              onClick={() => void move("item", sectionItems, itemIndex, -1)}
                            >
                              <ArrowUp />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Move item down"
                              aria-label={`Move ${item.name} down`}
                              disabled={busy || itemIndex === sectionItems.length - 1 || !!q}
                              onClick={() => void move("item", sectionItems, itemIndex, 1)}
                            >
                              <ArrowDown />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit item"
                              aria-label={`Edit ${item.name}`}
                              disabled={busy}
                              onClick={() =>
                                edit({ kind: "item", value: { ...item }, isNew: false })
                              }
                            >
                              <Pencil />
                            </Button>
                          </div>
                        )}
                      </div>
                      {canManage && optionPrices.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                            Meal choices and add-on prices ({optionPrices.length})
                          </summary>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {optionPrices.map((row) => (
                              <PriceControls
                                key={row.key}
                                row={row}
                                onChange={(updated) => {
                                  setPrices((current) =>
                                    current.map((p) => (p.key === updated.key ? updated : p)),
                                  );
                                  void queryClient.invalidateQueries({
                                    queryKey: catalogQuery.queryKey,
                                  });
                                }}
                              />
                            ))}
                          </div>
                        </details>
                      )}
                    </li>
                  );
                })}
                {shown.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {q ? "No matching items" : "No items in this section yet."}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet
        open={editorOpen}
        onOpenChange={(next) => {
          if (!busy) setEditorOpen(next);
        }}
      >
        <SheetContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("menu-name")?.focus();
          }}
          className="admin-ui flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
          aria-label={draft?.kind === "item" ? "Item editor" : "Section editor"}
        >
          {draft && (
            <form
              className="flex min-h-full flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <SheetHeader className="border-b border-border px-6 py-5 pr-12">
                <SheetTitle>
                  {draft.isNew ? "New" : "Edit"} {draft.kind}
                </SheetTitle>
                <SheetDescription>
                  {draft.kind === "item"
                    ? "Changes appear on the website right after you save."
                    : "Sections group items on the menu."}
                </SheetDescription>
              </SheetHeader>
              <fieldset
                disabled={busy}
                className="grid min-w-0 flex-1 content-start gap-4 px-6 py-5"
              >
                <Field label="Name" htmlFor="menu-name">
                  <input
                    id="menu-name"
                    required
                    maxLength={100}
                    className={fieldClass}
                    value={draft.value.name}
                    onChange={(e) => patchDraft({ name: e.target.value })}
                  />
                </Field>
                {draft.kind === "item" && (
                  <Field label="Section" htmlFor="menu-section">
                    <select
                      id="menu-section"
                      className={fieldClass}
                      value={draft.value.section_id}
                      onChange={(e) => patchDraft({ section_id: e.target.value })}
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field
                  label={draft.kind === "item" ? "Description" : "Section subtext"}
                  htmlFor="menu-desc"
                >
                  <textarea
                    id="menu-desc"
                    maxLength={1000}
                    rows={3}
                    className={`${fieldClass} h-auto py-2`}
                    value={draft.kind === "item" ? draft.value.description : draft.value.subtitle}
                    onChange={(e) =>
                      patchDraft(
                        draft.kind === "item"
                          ? { description: e.target.value }
                          : { subtitle: e.target.value },
                      )
                    }
                  />
                </Field>
                {draft.kind === "item" && (
                  <Field label="Price (₦)" htmlFor="menu-price">
                    <input
                      id="menu-price"
                      type="number"
                      min="0"
                      step="1"
                      required
                      className={fieldClass}
                      value={draft.value.price}
                      onChange={(e) => patchDraft({ price: Number(e.target.value) })}
                    />
                  </Field>
                )}
                <Field label="Photo" htmlFor="menu-photo" hint="JPG, PNG or WebP, up to 5 MB.">
                  <input
                    id="menu-photo"
                    className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                  {photo && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Selected: {photo.name}</p>
                  )}
                </Field>
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <label className="flex items-center justify-between gap-3 text-sm">
                    Visible on menu
                    <Switch
                      checked={draft.value.visible}
                      onCheckedChange={(visible) => patchDraft({ visible })}
                    />
                  </label>
                  {draft.kind === "item" && (
                    <label className="flex items-center justify-between gap-3 text-sm">
                      Available to order
                      <Switch
                        checked={draft.value.available}
                        onCheckedChange={(available) => patchDraft({ available })}
                      />
                    </label>
                  )}
                </div>
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </fieldset>
              <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background px-6 py-4">
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
