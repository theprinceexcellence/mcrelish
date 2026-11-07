import { useEffect, useState } from "react";
import { api, promoImageUrl } from "./api";

export type HeroPromo = {
  label: string;
  title: string;
  subtitle: string;
  product_id: string;
  active: boolean;
  /** File name of an uploaded flyer; empty = use the bundled mockup. */
  image_url: string;
};

export const defaultPromo: HeroPromo = {
  label: "November Jolly Fest",
  title: "Jolly Fest Feast",
  subtitle: "Special Jollof · Peppered Chicken · 2 Peppered Beef · Plantain · Coleslaw · Water · Zobo",
  product_id: "jolly-fest",
  active: true,
  image_url: "",
};

/** Loads the admin-editable hero promo after hydration. */
export function useHeroPromo() {
  const [promo, setPromo] = useState<HeroPromo>(defaultPromo);
  useEffect(() => {
    let alive = true;
    api<HeroPromo>("/api/promo").then((data) => { if (alive) setPromo(data); }).catch(() => { /* keep the default banner */ });
    return () => { alive = false; };
  }, []);
  return { promo, flyerUrl: promo.image_url ? promoImageUrl(promo.image_url) : null };
}
