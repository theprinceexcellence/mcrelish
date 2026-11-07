import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTicket, type Ticket } from "@/components/OrderTicket";
import { getTicket } from "@/lib/orders.functions";
import { getTicketAccess } from "@/lib/ticket-access";
import { downloadBlob, ticketToPdf, ticketWhatsappText, whatsappLink } from "@/lib/ticket-export";

export const Route = createFileRoute("/ticket/$reference")({
  head: () => ({ meta: [
    { title: "Your order ticket | McRelish" },
    { name: "description", content: "Your paid McRelish order ticket with full order and customer details." },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: "Your order ticket | McRelish" },
    { property: "og:description", content: "Your paid McRelish order ticket." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TicketPage,
});

function TicketPage() {
  const { reference } = Route.useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<Blob | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getTicketAccess(reference);
    if (!token) { setError("This ticket can only be opened on the device used to pay."); return; }
    getTicket({ data: { reference, token } })
      .then((t) => setTicket(t as unknown as Ticket))
      .catch(() => setError("We couldn't load this ticket."));
  }, [reference]);

  // Prepare the PDF ahead of time so Download and Share run instantly inside the tap.
  useEffect(() => {
    if (!ticket || !ref.current) return;
    const id = setTimeout(() => { if (ref.current) ticketToPdf(ref.current).then(setPdf).catch(() => setPdf(null)); }, 400);
    return () => clearTimeout(id);
  }, [ticket]);

  if (error) return <section className="section-pad px-4 text-center"><h1 className="font-display text-4xl font-bold">Ticket unavailable</h1><p className="mt-3 text-sm text-muted-foreground">{error}</p><Button asChild className="mt-6"><Link to="/menu">Back to menu</Link></Button></section>;
  if (!ticket) return <section className="section-pad px-4 text-center" role="status"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></section>;

  const filename = `McRelish-${ticket.reference}.pdf`;
  const paid = ticket.payment_status === "paid";

  const sendToWhatsapp = async () => {
    const text = ticketWhatsappText(ticket);
    const touch = matchMedia("(pointer: coarse)").matches;
    if (pdf && touch) {
      const file = new File([pdf], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); return; }
        catch (e) { if ((e as DOMException).name === "AbortError") return; }
      }
    }
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="section-pad px-4">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{paid ? "Payment received" : "Awaiting payment"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{paid ? "Your order is in. Keep this ticket for pickup or delivery." : "This order hasn't been paid yet."}</p>
        </div>
        <OrderTicket ref={ref} ticket={ticket} />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button className="min-h-12" disabled={!pdf} onClick={() => pdf && downloadBlob(pdf, filename)}>
            {pdf ? <Download /> : <Loader2 className="animate-spin" />}Download ticket
          </Button>
          <Button variant="outline" className="min-h-12" onClick={sendToWhatsapp}><MessageCircle />Send ticket to McRelish</Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">On your phone, choose WhatsApp to share the PDF ticket. On a computer, WhatsApp opens with your full ticket details ready to send.</p>
        <Button asChild variant="ghost" className="mt-4 w-full"><Link to="/menu">Back to menu</Link></Button>
      </div>
    </section>
  );
}
