import { business } from "@/data/menu";
import { formatNaira } from "@/lib/format";
import { displayOrderTime } from "@/lib/order";
import type { Ticket } from "@/components/OrderTicket";

/** Renders the on-screen ticket into an A4-width PDF Blob. Generate before the click so mobile share keeps user activation. */
export async function ticketToPdf(node: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const w = pageW - margin * 2;
  const h = (canvas.height / canvas.width) * w;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, margin, w, h);
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ticketWhatsappText(t: Ticket) {
  return [
    `Hello McRelish, here is my PAID order ticket.`,
    `Reference: ${t.reference}`,
    "",
    ...t.items.map((i) => `${i.quantity} × ${i.name} = ${formatNaira(i.lineTotal)}${i.details.length ? `\n  ${i.details.join("\n  ")}` : ""}${i.notes ? `\n  Notes: ${i.notes}` : ""}`),
    "",
    `Subtotal: ${formatNaira(t.subtotal)}`,
    `${t.method === "delivery" ? "Delivery" : "Pickup"}: ${formatNaira(t.delivery_fee)}`,
    `Total paid: ${formatNaira(t.total)}${t.flw_transaction_id ? ` (payment ID ${t.flw_transaction_id})` : ""}`,
    "",
    t.method === "delivery" ? `Delivery to: ${t.address} (${t.zone_name})` : `Pickup at: ${t.hub}`,
    `For: ${displayOrderTime(t.preferred_at)}`,
    `Customer: ${t.customer_name}, ${t.customer_phone}, ${t.customer_email}`,
    ...(t.notes ? [`Kitchen notes: ${t.notes}`] : []),
  ].join("\n");
}

export const whatsappLink = (text: string) => `https://wa.me/${business.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
