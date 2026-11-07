import { useEffect, useState } from "react";

/** Exit duration shared with the CSS close animations in styles.css. */
export const EXIT_MS = 420;

/** Keeps a closing pop-up mounted until its exit animation finishes. */
export function usePresence<T>(value: T | null | undefined | false, ms = EXIT_MS) {
  const [rendered, setRendered] = useState<T | null>(value || null);
  const open = Boolean(value);
  useEffect(() => {
    if (value) { setRendered(value); return; }
    const id = setTimeout(() => setRendered(null), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return { rendered: (value || rendered) as T | null, state: open ? ("open" as const) : ("closed" as const) };
}
