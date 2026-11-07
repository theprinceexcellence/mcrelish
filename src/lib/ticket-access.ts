import { z } from "zod";

const KEY = "mcrelish-tickets-v1";
const schema = z.array(z.object({ reference: z.string(), token: z.string().uuid() }));

function read() {
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    return parsed.success ? parsed.data : [];
  } catch { return []; }
}

/** Remembers the private ticket key on this device so the customer can reopen their ticket after paying. */
export function saveTicketAccess(reference: string, token: string) {
  try {
    const list = read().filter((t) => t.reference !== reference);
    localStorage.setItem(KEY, JSON.stringify([{ reference, token }, ...list].slice(0, 20)));
  } catch { /* storage blocked: the callback still carries the reference */ }
}

export function getTicketAccess(reference: string) {
  return read().find((t) => t.reference === reference)?.token ?? null;
}
