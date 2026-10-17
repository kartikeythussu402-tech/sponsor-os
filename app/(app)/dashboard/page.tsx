"use client";
import Link from "next/link";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { BriefCard, ListingCard } from "@/components/cards";
import { StatusPill } from "@/components/deal-bits";
import { Empty, LoginNeeded, Progress, useMounted } from "@/components/ui";
import { bestFit, fitScore } from "@/lib/fit";
import { inr, inrShort, timeAgo } from "@/lib/format";
import { raisedFor, useDB } from "@/lib/store";
import type { DB, Deal } from "@/lib/types";

function DealList({ db, deals, empty }: { db: DB; deals: Deal[]; empty: React.ReactNode }) {
  if (!deals.length) return <>{empty}</>;
  return (
    <ul className="card divide-y divide-line">
      {deals.slice(0, 5).map((d) => {
        const l = db.listings.find((x) => x.id === d.listingId);
        const other = db.role === "seeker" ? db.sponsors.find((s) => s.id === d.sponsorId)?.brand : l?.title;
        const last = d.messages[d.messages.length - 1];
        const yourMove = (d.status === "proposed" || d.status === "negotiating") && last && last.from !== db.role;
        return (
          <li key={d.id}>
            <Link href={`/deal/?id=${d.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-chalk/60">
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{other}</span>
                  {yourMove && <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white">Your move</span>}
                </span>
                <span className="block truncate text-sm text-ink-mute">{last ? last.text.replace(/^✓ /, "") : "No messages"} · {timeAgo(d.updatedAt)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="stat-num">{inr(d.amount)}</span>
                <StatusPill status={d.status} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ k, v, dark = false }: { k: string; v: string; dark?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] p-5 ${dark ? "bg-turf text-white" : "card"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/70" : "text-ink-mute"}`}>{k}</p>
      <p className={`stat-num mt-1 text-3xl ${dark ? "text-lime" : ""}`}>{v}</p>
    </div>
  );
}

export default function Dashboard() {
  const db = useDB();
  const mounted = useMounted();
  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!db.user) return <LoginNeeded what="Your dashboard" />;

  if (db.role === "seeker") {
    const me = db.me.seeker;
    const mine = db.listings.filter((l) => l.ownerId === me.id);
    const deals = db.deals.filter((d) => d.seekerId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const committed = deals.filter((d) => d.status === "accepted" || d.status === "completed").reduce((s, d) => s + d.amount, 0);
    const goal = mine.reduce((s, l) => s + l.goal, 0);
    const pending = deals.filter((d) => d.status === "proposed" || d.status === "negotiating");
    const escrow = deals.filter((d) => d.payment.status === "held").reduce((s, d) => s + d.amount, 0);
    const paidOut = deals.filter((d) => d.payment.status === "released").reduce((s, d) => s + d.payment.payout, 0);
    const dueDeliverables = deals.filter((d) => d.status === "accepted").flatMap((d) => d.deliverables.filter((x) => !x.done).map((x) => ({ d, x })));
    const suggestions = mine.length
      ? db.briefs
          .map((b) => ({ b, score: Math.max(...mine.map((l) => fitScore(l, b).score)) }))
          .filter(({ b }) => !deals.some((d) => d.briefId === b.id))
          .sort((a, z) => z.score - a.score)
          .slice(0, 3)
      : [];

    return (
      <div className="container-page py-10 sm:py-14">
        <p className="eyebrow text-turf-3">Seeker dashboard</p>
        <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">{me.name}</h1>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat k={`Committed of ${inrShort(goal)}`} v={inrShort(committed)} dark />
          <Stat k="Held in escrow" v={inrShort(escrow)} />
          <Stat k="Paid out to you" v={inrShort(paidOut)} />
          <Stat k="Open offers" v={String(pending.length)} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="display-tight text-2xl">Your listing{mine.length > 1 ? "s" : ""}</h2>
                <Link href="/listing/edit/?new=1" className="btn btn-ghost btn-sm"><Plus size={15} aria-hidden="true" /> New</Link>
              </div>
              {mine.length ? (
                <div className="flex flex-col gap-4">
                  {mine.map((l) => (
                    <div key={l.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <Link href={`/listing/?id=${l.id}`} className="display-tight text-lg hover:underline">{l.title}</Link>
                        <p className="text-sm text-ink-mute">{l.packages.length} packages · {l.sport} · {l.city}</p>
                        <div className="mt-3"><Progress value={raisedFor(db, l.id)} goal={l.goal} /></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/listing/edit/?id=${l.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                        <Link href={`/kit/?id=${l.id}`} target="_blank" className="btn btn-primary btn-sm"><FileText size={14} aria-hidden="true" /> Deck</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="Create your sponsorship listing" action={<Link href="/listing/edit/?new=1" className="btn btn-primary">Create listing</Link>}>
                  Five minutes: your story, reach and priced packages. Brands can then send you offers.
                </Empty>
              )}
            </section>
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="display-tight text-2xl">Recent deals</h2>
                <Link href="/deals/" className="btn btn-ghost btn-sm">All <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <DealList db={db} deals={deals} empty={<Empty title="No deals yet">Pitch a brand below, or share your deck.</Empty>} />
            </section>
          </div>
          <div className="flex flex-col gap-8">
            {dueDeliverables.length > 0 && (
              <section>
                <h2 className="display-tight mb-4 text-2xl">To deliver</h2>
                <ul className="card divide-y divide-line">
                  {dueDeliverables.slice(0, 5).map(({ d, x }) => (
                    <li key={x.id}>
                      <Link href={`/deal/?id=${d.id}`} className="block p-4 hover:bg-chalk/60">
                        <span className="font-semibold">{x.text}</span>
                        <span className="block text-sm text-ink-mute">for {db.sponsors.find((s) => s.id === d.sponsorId)?.brand}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="display-tight text-2xl">Brands that fit you</h2>
                <Link href="/sponsors/" className="btn btn-ghost btn-sm">All briefs <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <div className="flex flex-col gap-4">
                {suggestions.length ? suggestions.map(({ b, score }) => <BriefCard key={b.id} b={b} fit={score} />) : <Empty title="No suggestions yet">Create a listing to see matching brands.</Empty>}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Sponsor
  const me = db.me.sponsor;
  const briefs = db.briefs.filter((b) => b.ownerId === me.id);
  const deals = db.deals.filter((d) => d.sponsorId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const committed = deals.filter((d) => d.status === "accepted" || d.status === "completed").reduce((s, d) => s + d.amount, 0);
  const pipeline = deals.filter((d) => d.status === "proposed" || d.status === "negotiating").reduce((s, d) => s + d.amount, 0);
  const shortlist = db.listings.filter((l) => db.saved.includes(l.id));
  const matches = briefs.length
    ? db.listings
        .map((l) => ({ l, f: bestFit(l, briefs) }))
        .filter(({ l }) => !deals.some((d) => d.listingId === l.id))
        .sort((a, z) => (z.f?.score ?? 0) - (a.f?.score ?? 0))
        .slice(0, 3)
    : [];
  const reach = deals
    .filter((d) => d.status === "accepted" || d.status === "completed")
    .map((d) => db.listings.find((l) => l.id === d.listingId))
    .reduce((s, l) => s + (l ? l.audience.attendance + l.audience.instagram + l.audience.youtube + l.audience.whatsapp : 0), 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Sponsor dashboard</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">{me.brand}</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="Committed" v={inrShort(committed)} dark />
        <Stat k="Held in escrow" v={inrShort(deals.filter((d) => d.payment.status === "held").reduce((s, d) => s + d.amount, 0))} />
        <Stat k="In negotiation" v={inrShort(pipeline)} />
        <Stat k="Cost per 1k reach" v={reach && committed ? inr(Math.round((committed / reach) * 1000)) : "—"} />
      </div>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display-tight text-2xl">Top matches for your brief</h2>
          <Link href="/discover/" className="btn btn-ghost btn-sm">Discover <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        {briefs.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map(({ l, f }) => <ListingCard key={l.id} l={l} fit={f?.score} showSave />)}
          </div>
        ) : (
          <Empty title="Post your first brief" action={<Link href="/brief/edit/?new=1" className="btn btn-primary">Post a brief</Link>}>
            Tell seekers what you want to sponsor and get fit scores on every listing.
          </Empty>
        )}
      </section>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display-tight text-2xl">Recent deals</h2>
              <Link href="/deals/" className="btn btn-ghost btn-sm">All <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <DealList db={db} deals={deals} empty={<Empty title="No deals yet">Send an offer on any listing.</Empty>} />
          </section>
        </div>
        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display-tight text-2xl">Your briefs</h2>
              <Link href="/brief/edit/?new=1" className="btn btn-ghost btn-sm"><Plus size={15} aria-hidden="true" /> New</Link>
            </div>
            <div className="flex flex-col gap-4">{briefs.map((b) => <BriefCard key={b.id} b={b} />)}</div>
          </section>
          <section>
            <h2 className="display-tight mb-4 text-2xl">Shortlist</h2>
            {shortlist.length ? (
              <ul className="card divide-y divide-line">
                {shortlist.map((l) => (
                  <li key={l.id}>
                    <Link href={`/listing/?id=${l.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-chalk/60">
                      <span className="font-semibold">{l.title}</span>
                      <span className="text-sm text-ink-mute">{l.sport} · {l.state}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nothing shortlisted">Tap “Shortlist” on listings you like.</Empty>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
