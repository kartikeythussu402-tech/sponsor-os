"use client";
import Link from "next/link";
import { useState } from "react";
import { PayPill, StatusPill } from "@/components/deal-bits";
import { Empty, LoginNeeded, SportBadge, useMounted } from "@/components/ui";
import { inr, timeAgo } from "@/lib/format";
import { useDB } from "@/lib/store";
import type { DealStatus } from "@/lib/types";

const TABS: Array<{ id: "open" | DealStatus | "all"; label: string }> = [
  { id: "open", label: "Open" },
  { id: "accepted", label: "Accepted" },
  { id: "completed", label: "Completed" },
  { id: "declined", label: "Declined" },
  { id: "all", label: "All" },
];

export default function DealsPage() {
  const db = useDB();
  const mounted = useMounted();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("open");
  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!db.user) return <LoginNeeded what="Your deals" />;

  const role = db.role;
  const mine = db.deals
    .filter((d) => (role === "seeker" ? d.seekerId === db.me.seeker.id : d.sponsorId === db.me.sponsor.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const rows = mine.filter((d) => (tab === "all" ? true : tab === "open" ? d.status === "proposed" || d.status === "negotiating" : d.status === tab));
  const committed = mine.filter((d) => d.status === "accepted" || d.status === "completed").reduce((s, d) => s + d.amount, 0);
  const pipeline = mine.filter((d) => d.status === "proposed" || d.status === "negotiating").reduce((s, d) => s + d.amount, 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow text-turf-3">{role === "seeker" ? db.me.seeker.name : db.me.sponsor.brand}</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">Deals</h1>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["In negotiation", inr(pipeline)],
          [role === "seeker" ? "Committed to you" : "Committed by you", inr(committed)],
          ["Held in escrow", inr(mine.filter((d) => d.payment.status === "held").reduce((s, d) => s + d.amount, 0))],
          ["Total deals", String(mine.length)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{k}</dt>
            <dd className="stat-num mt-1 text-2xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div role="tablist" aria-label="Filter deals" className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = t.id === "all" ? mine.length : t.id === "open" ? mine.filter((d) => ["proposed", "negotiating"].includes(d.status)).length : mine.filter((d) => d.status === t.id).length;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="pill-btn aria-selected:border-turf aria-selected:bg-turf aria-selected:text-white" onClick={() => setTab(t.id)}>
              {t.label} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {rows.length ? (
          <ul className="card divide-y divide-line">
            {rows.map((d) => {
              const l = db.listings.find((x) => x.id === d.listingId);
              const other = role === "seeker" ? db.sponsors.find((s) => s.id === d.sponsorId)?.brand : l?.title;
              const pkg = l?.packages.find((p) => p.id === d.packageId);
              const last = d.messages[d.messages.length - 1];
              const awaiting = (d.status === "proposed" || d.status === "negotiating") && last && last.from !== role;
              return (
                <li key={d.id}>
                  <Link href={`/deal/?id=${d.id}`} className="flex items-center gap-4 p-4 hover:bg-chalk/60 sm:p-5">
                    <SportBadge sport={l?.sport ?? "Other"} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        <span className="truncate">{other ?? "Unknown"}</span>
                        {awaiting && <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white">Your move</span>}
                      </p>
                      <p className="truncate text-sm text-ink-mute">
                        {role === "sponsor" ? (pkg?.name ?? "Custom offer") : `${l?.title ?? ""} · ${pkg?.name ?? "Custom"}`} · {d.initiatedBy === role ? "you started" : "they started"} · {timeAgo(d.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="stat-num text-lg">{inr(d.amount)}</span>
                      <StatusPill status={d.status} />
                      {d.payment.status !== "unpaid" && <PayPill status={d.payment.status} />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty
            title={tab === "open" ? "No open deals" : "Nothing here yet"}
            action={<Link href={role === "seeker" ? "/sponsors/" : "/discover/"} className="btn btn-primary">{role === "seeker" ? "Pitch a sponsor" : "Find someone to sponsor"}</Link>}
          >
            {role === "seeker" ? "Pitch brands from their briefs, or share your deck so they send you offers." : "Send an offer on any listing to start a deal."}
          </Empty>
        )}
      </div>
    </div>
  );
}
