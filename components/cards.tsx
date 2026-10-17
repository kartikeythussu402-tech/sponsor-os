"use client";
import Link from "next/link";
import { Bookmark, BookmarkCheck, CalendarDays, MapPin } from "lucide-react";
import { inrShort, niceDate } from "@/lib/format";
import { actions, raisedFor, useDB } from "@/lib/store";
import type { Brief, Listing } from "@/lib/types";
import { FitBadge, KindTag, Progress, ReachRow, SportBadge } from "./ui";

export function ListingCard({ l, fit, showSave = false }: { l: Listing; fit?: number; showSave?: boolean }) {
  const db = useDB();
  const raised = raisedFor(db, l.id);
  const saved = db.saved.includes(l.id);
  const from = Math.min(...l.packages.map((p) => p.price));
  return (
    <article className="card group relative flex flex-col gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start gap-3">
        <SportBadge sport={l.sport} />
        <div className="min-w-0 flex-1">
          <h3 className="display-tight text-lg leading-tight">
            <Link href={`/listing/?id=${l.id}`} className="after:absolute after:inset-0 hover:underline">
              {l.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{l.city}, {l.state}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" />{l.dates.split("·")[0].trim()}</span>
          </p>
        </div>
        {fit !== undefined && <FitBadge score={fit} />}
      </div>
      <p className="text-sm leading-relaxed text-ink-soft">{l.headline}</p>
      <div className="flex flex-wrap gap-1.5">
        <KindTag kind={l.kind} />
        <span className="chip">{l.sport}</span>
        <span className="chip capitalize">{l.level}</span>
        {l.acceptsInKind && <span className="chip">In-kind OK</span>}
      </div>
      <ReachRow a={l.audience} />
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-4">
        <div className="min-w-0 flex-1">
          <Progress value={raised} goal={l.goal} />
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Packages from</p>
          <p className="stat-num text-xl">{inrShort(from)}</p>
        </div>
      </div>
      {showSave && (
        <button
          type="button"
          onClick={() => actions.toggleSave(l.id).catch((e: Error) => alert(e.message))}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${l.title} from shortlist` : `Shortlist ${l.title}`}
          className="btn btn-secondary btn-sm relative z-10 self-start"
        >
          {saved ? <BookmarkCheck size={15} className="text-turf-3" aria-hidden="true" /> : <Bookmark size={15} aria-hidden="true" />}
          {saved ? "Shortlisted" : "Shortlist"}
        </button>
      )}
    </article>
  );
}

export function BriefCard({ b, fit }: { b: Brief; fit?: number }) {
  return (
    <article className="card relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-turf-3">{b.industry}</p>
          <h3 className="display-tight mt-1 text-lg leading-tight">
            <Link href={`/brief/?id=${b.id}`} className="after:absolute after:inset-0 hover:underline">
              {b.brand}
            </Link>
          </h3>
        </div>
        {fit !== undefined && <FitBadge score={fit} />}
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{b.about}</p>
      <div className="flex flex-wrap gap-1.5">
        {(b.sports.length ? b.sports.slice(0, 4) : ["Any sport"]).map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
        {(b.states.length ? b.states.slice(0, 3) : ["Pan-India"]).map((s) => (
          <span key={s} className="chip"><MapPin size={11} aria-hidden="true" />{s}</span>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Budget per deal</p>
          <p className="stat-num text-xl">{inrShort(b.budgetMin)}–{inrShort(b.budgetMax)}</p>
        </div>
        <p className="text-right text-xs text-ink-mute">Pitch by<br /><strong className="text-ink">{niceDate(b.deadline)}</strong></p>
      </div>
    </article>
  );
}
