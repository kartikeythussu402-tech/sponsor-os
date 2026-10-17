"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check, MapPin, Pencil, Target } from "lucide-react";
import { ListingCard } from "@/components/cards";
import { PitchModal } from "@/components/deal-forms";
import { Empty, FitBadge, useMounted } from "@/components/ui";
import { fitScore } from "@/lib/fit";
import { inr, niceDate } from "@/lib/format";
import { useDB } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/types";

function BriefDetail() {
  const id = useSearchParams().get("id") ?? "";
  const db = useDB();
  const mounted = useMounted();
  const [pitch, setPitch] = useState(false);
  const b = db.briefs.find((x) => x.id === id);
  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!b) {
    return (
      <div className="container-page py-16">
        <Empty title="Brief not found" action={<Link href="/sponsors/" className="btn btn-primary">All briefs</Link>} />
      </div>
    );
  }
  const isOwner = db.role === "sponsor" && b.ownerId === db.me.sponsor.id;
  const asSeeker = db.role === "seeker";
  const myListings = db.listings.filter((l) => l.ownerId === db.me.seeker.id);
  const fits = myListings.map((l) => ({ l, f: fitScore(l, b) })).sort((a, z) => z.f.score - a.f.score);
  const myPitch = asSeeker ? db.deals.find((d) => d.briefId === b.id && d.seekerId === db.me.seeker.id) : null;
  const matches = isOwner ? db.listings.map((l) => ({ l, f: fitScore(l, b) })).sort((a, z) => z.f.score - a.f.score).slice(0, 6) : [];

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href={isOwner ? "/brief/edit/" : "/sponsors/"} className="text-sm font-semibold text-ink-mute hover:text-ink">← Back</Link>
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div>
            <p className="eyebrow text-turf-3">{b.industry} · sponsor brief</p>
            <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">{b.brand}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{b.about}</p>
          </div>
          <dl className="card grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <dt className="eyebrow text-ink-mute">Budget per deal</dt>
              <dd className="stat-num mt-1 text-2xl">{inr(b.budgetMin)} – {inr(b.budgetMax)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-mute">Pitch by</dt>
              <dd className="stat-num mt-1 text-2xl">{niceDate(b.deadline)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-mute">Sports</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{(b.sports.length ? b.sports : ["Any sport"]).map((s) => <span key={s} className="chip">{s}</span>)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-mute">Regions</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{(b.states.length ? b.states : ["Pan-India"]).map((s) => <span key={s} className="chip"><MapPin size={11} aria-hidden="true" />{s}</span>)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-mute">Objectives</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{b.objectives.map((s) => <span key={s} className="chip"><Target size={11} aria-hidden="true" />{s}</span>)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-mute">Preferred formats</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{(b.formats.length ? b.formats : ["Open"]).map((s) => <span key={s} className="chip">{s}</span>)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="eyebrow text-ink-mute">Level</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5 capitalize">{(b.levels.length ? b.levels : ["any level"]).map((s) => <span key={s} className="chip">{s}</span>)}</dd>
            </div>
          </dl>
        </div>
        <aside className="flex flex-col gap-5">
          {asSeeker && (
            <section className="card flex flex-col gap-4 p-6">
              {fits[0] && (
                <div className="flex items-center justify-between">
                  <h2 className="eyebrow text-ink-mute">Your fit</h2>
                  <FitBadge score={fits[0].f.score} />
                </div>
              )}
              {fits[0] && (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {fits[0].f.reasons.map((r) => <li key={r} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-turf-3" aria-hidden="true" />{r}</li>)}
                  {fits[0].f.gaps.map((g) => <li key={g} className="flex gap-2 text-clay"><span className="w-[15px] text-center" aria-hidden="true">–</span>{g}</li>)}
                </ul>
              )}
              {myPitch ? (
                <Link href={`/deal/?id=${myPitch.id}`} className="btn btn-primary">View your pitch · {STATUS_LABEL[myPitch.status]}</Link>
              ) : (
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setPitch(true)}>Pitch {b.brand}</button>
              )}
            </section>
          )}
          {!db.user && (
            <section className="card flex flex-col gap-3 p-6">
              <h2 className="eyebrow text-ink-mute">Want this sponsor?</h2>
              <p className="text-sm text-ink-soft">Log in with a team or athlete account to pitch {b.brand} with your listing.</p>
              <Link href={`/login/?next=${encodeURIComponent(`/brief/?id=${b.id}`)}`} className="btn btn-primary">Log in to pitch</Link>
            </section>
          )}
          {isOwner && (
            <section className="card flex flex-col gap-3 p-6">
              <h2 className="eyebrow text-ink-mute">This is your brief</h2>
              <Link href={`/brief/edit/?id=${b.id}`} className="btn btn-secondary"><Pencil size={15} aria-hidden="true" /> Edit brief</Link>
              <Link href="/discover/" className="btn btn-primary">Discover all listings</Link>
            </section>
          )}
        </aside>
      </div>
      {isOwner && (
        <section className="mt-12">
          <h2 className="display-tight text-2xl">Best matches for this brief</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {matches.map(({ l, f }) => <ListingCard key={l.id} l={l} fit={f.score} showSave />)}
          </div>
        </section>
      )}
      {pitch && <PitchModal brief={b} onClose={() => setPitch(false)} />}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" aria-hidden="true" />}>
      <BriefDetail />
    </Suspense>
  );
}
