import type { DealStatus, PaymentStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const STYLE: Record<DealStatus, string> = {
  proposed: "bg-sky/10 text-sky ring-1 ring-sky/30",
  negotiating: "bg-clay-soft text-clay ring-1 ring-clay/30",
  accepted: "bg-lime text-ink",
  declined: "bg-chalk-2 text-ink-mute",
  completed: "bg-turf text-white",
};

export function StatusPill({ status }: { status: DealStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

const PAY: Record<PaymentStatus, [string, string]> = {
  unpaid: ["Not paid", "bg-chalk-2 text-ink-mute"],
  held: ["Held in escrow", "bg-sky/10 text-sky ring-1 ring-sky/30"],
  released: ["Paid out", "bg-turf text-white"],
};

export function PayPill({ status }: { status: PaymentStatus }) {
  const [label, cls] = PAY[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}
