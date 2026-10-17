"use client";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { inr } from "@/lib/format";
import { setState } from "@/lib/store";
import type { DB, Deal } from "@/lib/types";

/* Razorpay Standard Web Checkout for escrow. The browser only sends the deal id: the server
   reads the amount from the deal, creates the order, and verifies the signature afterwards. */

interface RzpSuccess { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RzpFailure { error?: { description?: string } }
interface RzpInstance { open(): void; on(event: "payment.failed", cb: (r: RzpFailure) => void): void }
declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => RzpInstance }
}

let script: Promise<boolean> | null = null;
function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  script ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(Boolean(window.Razorpay));
    s.onerror = () => {
      script = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return script;
}

type St = { k: "idle" } | { k: "busy"; msg: string } | { k: "error"; msg: string } | { k: "cancelled" };

export function PayEscrowButton({ deal, title }: { deal: Deal; title: string }) {
  const [st, setSt] = useState<St>({ k: "idle" });

  const pay = async () => {
    setSt({ k: "busy", msg: "Preparing secure checkout…" });
    if (!(await loadCheckout()) || !window.Razorpay) {
      return setSt({ k: "error", msg: "Couldn't load Razorpay. Check your connection or turn off ad-blockers, then try again." });
    }
    let order: { orderId: string; amount: number; currency: string; keyId: string; name: string; email: string };
    try {
      const res = await fetch("/api/pay/order/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dealId: deal.id }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setSt({ k: "error", msg: data.error ?? "Couldn't start the payment." });
      order = data;
    } catch {
      return setSt({ k: "error", msg: "You seem to be offline. Please try again." });
    }

    setSt({ k: "busy", msg: "Waiting for payment…" });
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Sponsor OS",
      description: `Escrow · ${title}`.slice(0, 250),
      prefill: { name: order.name, email: order.email },
      notes: { deal_id: deal.id },
      theme: { color: "#123d2a" },
      modal: { ondismiss: () => setSt((s) => (s.k === "busy" ? { k: "cancelled" } : s)) },
      handler: async (r: RzpSuccess) => {
        setSt({ k: "busy", msg: "Verifying payment…" });
        try {
          const res = await fetch("/api/pay/verify/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.verified) return setSt({ k: "error", msg: data.error ?? `We couldn't verify this payment. Your payment ID is ${r.razorpay_payment_id}.` });
          if (data.db) setState(data.db as DB);
          setSt({ k: "idle" });
        } catch {
          setSt({ k: "error", msg: `Network error while verifying. Your payment ID is ${r.razorpay_payment_id} — refresh to check its status.` });
        }
      },
    });
    rzp.on("payment.failed", (r) => setSt({ k: "error", msg: r.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. No money was taken — please try again." }));
    rzp.open();
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-lime btn-lg" onClick={pay} disabled={st.k === "busy"}>
        {st.k === "busy" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
        {st.k === "busy" ? st.msg : `Pay ${inr(deal.amount)} into escrow`}
      </button>
      {st.k === "cancelled" && <p role="status" className="text-sm text-ink-soft">Payment cancelled — nothing was charged.</p>}
      {st.k === "error" && <p role="alert" className="field-error">{st.msg}</p>}
      <p className="text-xs text-ink-mute">Secured by Razorpay · test mode: choose Netbanking → any bank → Success. No real money moves.</p>
    </div>
  );
}
