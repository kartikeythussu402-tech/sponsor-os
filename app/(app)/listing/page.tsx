"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Bookmark, BookmarkCheck, CalendarDays, Check, Copy, FileText, MapPin, Pencil, Users } from "lucide-react";
import { OfferModal } from "@/components/deal-forms";
import { Empty, FitBadge, KindTag, Progress, ReachRow, SportBadge, useMounted } from "@/components/ui";
import { bestFit } from "@/lib/fit";
import { count, inr } from "@/lib/format";
import { actions, raisedFor, useDB } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/types";

function ListingDetail() {
  const id = useSearchParams().get("id") ?? "";
  const db = useDB();
  const mounted = useMounted();
  const [offer, setOffer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const l = db.listings.find((x) => x.id === id);

  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!l) {
    return (
      <div className="container-page py-16">
        <Empty title="Listing not found" action={<Link href="/discover/" className="btn btn-primary">Browse listings</Link>}>
          It may have been removed.
        </Empty>
      </div>
    );
  }

  const raised = raisedFor(db, l.id);
  const isOwner = l.ownerId === db.me.seeker.id && db.role === "seeker";
  const asSponsor = db.role === "sponsor";
  const myBriefs = db.briefs.filter((b) => b.ownerId === db.me.sponsor.id);
  const fit = asSponsor && myBriefs.length ? bestFit(l, myBriefs) : null;
  const myDeal = asSponsor ? db.deals.find((d) => d.listingId === l.id && d.sponsorId === db.me.sponsor.id) : null;
  const ownerDeals = isOwner ? db.deals.filter((d) => d.listingId === l.id) : [];
  const saved = db.saved.includes(l.id);
  const kitUrl = typeof window !== "undefined" ? `${window.location.origin}/kit/?id=${l.id}` : "";
  const share = `https://wa.me/?text=${encodeURIComponent(`Sponsorship opportunity: ${l.title} — ${l.headline} ${kitUrl}`)}`;

  return (
    <>
      <section className="relative overflow-hidden bg-turf text-white">
        <div className="striped pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-10 sm:py-14">
          <Link href={asSponsor ? "/discover/" : "/dashboard/"} className="text-sm font-semibold text-white/75 hover:text-white">← Back</Link>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <SportBadge sport={l.sport} size={64} />
              <div>
                <p className="eyebrow text-lime">{l.sport} · {l.level} level</p>
                <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">{l.title}</h1>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" />{l.city}, {l.state}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{l.dates}</span>
                  <span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden="true" />{l.contactName}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {asSponsor && (
                <>
                  <button type="button" className="btn border border-white/30 text-white hover:bg-white/10" aria-pressed={saved} onClick={() => actions.toggleSave(l.id).catch((e: Error) => alert(e.message))}>
                    {saved ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
                    {saved ? "Shortlisted" : "Shortlist"}
                  </button>
                  {myDeal && !["declined", "completed"].includes(myDeal.status) ? (
                    <Link href={`/deal/?id=${myDeal.id}`} className="btn btn-lime">View your deal · {STATUS_LABEL[myDeal.status]}</Link>
                  ) : (
                    <button type="button" className="btn btn-lime" onClick={() => setOffer(l.packages[0]?.id ?? "custom")}>Send an offer</button>
                  )}
                </>
              )}
              {!db.user && (
                <Link href={`/login/?next=${encodeURIComponent(`/listing/?id=${l.id}`)}`} className="btn btn-lime">Log in as a brand to make an offer</Link>
              )}
              {isOwner && (
                <Link href={`/listing/edit/?id=${l.id}`} className="btn btn-lime"><Pencil size={16} aria-hidden="true" /> Edit listing</Link>
              )}
              <Link href={`/kit/?id=${l.id}`} className="btn border border-white/30 text-white hover:bg-white/10" target="_blank">
                <FileText size={16} aria-hidden="true" /> Sponsorship deck
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <section>
            <p className="display-tight text-2xl leading-snug">“{l.headline}”</p>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{l.story}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <KindTag kind={l.kind} />
              {l.acceptsInKind && <span className="chip">Accepts in-kind support</span>}
              {l.formats.map((f) => <span key={f} className="chip">{f}</span>)}
            </div>
          </section>

          <section>
            <h2 className="display-tight mb-4 text-2xl">Sponsorship packages</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {l.packages.map((p, i) => (
                <article key={p.id} className={`flex flex-col gap-3 rounded-[var(--radius-card)] p-5 ${i === l.packages.length - 1 && l.packages.length > 1 ? "bg-ink text-white" : "card"}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="display-tight text-lg">{p.name}</h3>
                    <p className="stat-num text-2xl">{inr(p.price)}</p>
                  </div>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex gap-2"><Check size={16} className={`mt-0.5 shrink-0 ${i === l.packages.length - 1 && l.packages.length > 1 ? "text-lime" : "text-turf-3"}`} aria-hidden="true" />{d}</li>
                    ))}
                  </ul>
                  {asSponsor && (
                    <button type="button" className={`btn btn-sm mt-auto self-start ${i === l.packages.length - 1 && l.packages.length > 1 ? "btn-lime" : "btn-primary"}`} onClick={() => setOffer(p.id)}>
                      Offer on this package
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="card p-5">
            <h2 className="eyebrow mb-3 text-ink-mute">Funding</h2>
            <Progress value={raised} goal={l.goal} />
          </section>
          <section className="card p-5">
            <h2 className="eyebrow mb-3 text-ink-mute">Audience & reach</h2>
            <ReachRow a={l.audience} />
            <p className="mt-3 text-sm text-ink-soft">{l.audience.demographic}</p>
            <p className="mt-3 text-xs text-ink-mute">Total reach ≈ {count(l.audience.attendance + l.audience.instagram + l.audience.youtube + l.audience.whatsapp)} · self-reported by the seeker</p>
          </section>
          {fit && (
            <section className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="eyebrow text-ink-mute">Fit with your brief</h2>
                <FitBadge score={fit.score} />
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {fit.reasons.map((r) => <li key={r} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-turf-3" aria-hidden="true" />{r}</li>)}
                {fit.gaps.map((g) => <li key={g} className="flex gap-2 text-clay"><span aria-hidden="true" className="w-[15px] text-center">–</span>{g}</li>)}
              </ul>
            </section>
          )}
          {l.pastSponsors && (
            <section className="card p-5">
              <h2 className="eyebrow mb-2 text-ink-mute">Past sponsors</h2>
              <p className="text-sm text-ink-soft">{l.pastSponsors}</p>
            </section>
          )}
          {isOwner && (
            <section className="card p-5">
              <h2 className="eyebrow mb-3 text-ink-mute">Share your deck</h2>
              <div className="flex flex-wrap gap-2">
                <a href={share} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#1f7a4d] text-white hover:bg-[#186540]">Send on WhatsApp</a>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(kitUrl); } catch { /* ignore */ }
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <Copy size={14} aria-hidden="true" /> {copied ? "Copied" : "Copy link"}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-mute">Demo mode: the deck link opens in browsers that have this demo data.</p>
            </section>
          )}
          {isOwner && (
            <section className="card p-5">
              <h2 className="eyebrow mb-3 text-ink-mute">Deals on this listing</h2>
              {ownerDeals.length ? (
                <ul className="flex flex-col divide-y divide-line">
                  {ownerDeals.map((d) => {
                    const sp = db.sponsors.find((s) => s.id === d.sponsorId);
                    return (
                      <li key={d.id}>
                        <Link href={`/deal/?id=${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:underline">
                          <span className="font-semibold">{sp?.brand ?? "Sponsor"}</span>
                          <span className="text-sm text-ink-mute">{inr(d.amount)} · {STATUS_LABEL[d.status]}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">No offers yet. <Link className="font-semibold text-turf-3 underline" href="/sponsors/">Pitch a brand</Link>.</p>
              )}
            </section>
          )}
        </aside>
      </div>
      {offer && <OfferModal listing={l} packageId={offer} onClose={() => setOffer(null)} />}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" aria-hidden="true" />}>
      <ListingDetail />
    </Suspense>
  );
}
