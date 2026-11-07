import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api, promoImageUrl, uploadImage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { useStore } from "@/lib/store";
import type { HeroPromo } from "@/lib/promo";
import { Field, PageHeader, Panel, Pill, SkeletonRows, fieldClass } from "./ui";

export function Banner() {
  const {
    catalog: { products },
  } = useStore();
  const [promo, setPromo] = useState<HeroPromo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<HeroPromo>("/api/promo")
      .then(setPromo)
      .catch(() => toast.error("Couldn't load the banner"));
  }, []);

  if (!promo) return <SkeletonRows rows={2} className="h-40" />;

  const save = async (patch: Partial<HeroPromo>) => {
    setBusy(true);
    try {
      const saved = await api<HeroPromo>("/api/admin/promo", { body: patch });
      setPromo((p) => (p ? { ...p, ...saved } : saved));
    } catch {
      setBusy(false);
      toast.error("Couldn't save");
      return;
    }
    setBusy(false);
    void logAudit("home_banner", { title: patch.title ?? promo.title }).catch(() => {});
    toast.success("Banner saved");
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    setBusy(true);
    let path = "";
    try {
      path = await uploadImage("promo", file);
    } catch (e) {
      setBusy(false);
      toast.error(e instanceof Error ? e.message : "Upload failed");
      return;
    }
    setBusy(false);
    await save({ image_url: path });
  };

  const product = products.find((p) => p.id === promo.product_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home banner"
        description="The campaign shown beside the home page headline. The price comes from the menu."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save({
              label: promo.label,
              title: promo.title,
              subtitle: promo.subtitle,
              product_id: promo.product_id,
            });
          }}
        >
          <Panel>
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Show campaign</span>
                <span className="block text-xs text-muted-foreground">
                  Turn off to hide the banner without losing its content.
                </span>
              </span>
              <Switch
                checked={promo.active}
                disabled={busy}
                onCheckedChange={(v) => void save({ active: v })}
              />
            </label>
          </Panel>
          <Panel title="Content">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge" htmlFor="promo-label">
                <input
                  id="promo-label"
                  className={fieldClass}
                  value={promo.label}
                  onChange={(e) => setPromo({ ...promo, label: e.target.value })}
                />
              </Field>
              <Field label="Title" htmlFor="promo-title">
                <input
                  id="promo-title"
                  className={fieldClass}
                  value={promo.title}
                  onChange={(e) => setPromo({ ...promo, title: e.target.value })}
                />
              </Field>
              <Field label="What's included" htmlFor="promo-sub" className="sm:col-span-2">
                <textarea
                  id="promo-sub"
                  rows={2}
                  className={`${fieldClass} h-auto py-2`}
                  value={promo.subtitle}
                  onChange={(e) => setPromo({ ...promo, subtitle: e.target.value })}
                />
              </Field>
              <Field label="Menu item it orders" htmlFor="promo-product" className="sm:col-span-2">
                <select
                  id="promo-product"
                  className={fieldClass}
                  value={promo.product_id}
                  onChange={(e) => setPromo({ ...promo, product_id: e.target.value })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>
          <Panel
            title="Flyer image"
            description={promo.image_url ? "Using your uploaded flyer." : "Using the sample photo."}
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                aria-label="Upload flyer image"
                className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                }}
              />
              {promo.image_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void save({ image_url: "" })}
                >
                  Use sample photo
                </Button>
              )}
            </div>
          </Panel>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save banner"}
          </Button>
        </form>

        <aside aria-label="Banner preview" className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid aspect-[4/3] place-items-center bg-muted">
              {promo.image_url ? (
                <img
                  src={promoImageUrl(promo.image_url)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                {promo.label && <Pill tone="primary">{promo.label}</Pill>}
                {!promo.active && <Pill>Hidden</Pill>}
              </div>
              <p className="text-lg font-semibold leading-tight">{promo.title || "Title"}</p>
              <p className="text-sm text-muted-foreground">{promo.subtitle || "What's included"}</p>
              {product && <p className="text-sm font-semibold">Orders: {product.name}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
