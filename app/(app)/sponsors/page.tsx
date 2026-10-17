"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BriefCard } from "@/components/cards";
import { Empty, useMounted } from "@/components/ui";
import { fitScore } from "@/lib/fit";
import { useDB } from "@/lib/store";
import { OBJECTIVES, SPORTS } from "@/lib/types";

export default function SponsorsPage() {
  const db = useDB();
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [objective, setObjective] = useState("");
  const myListings = db.listings.filter((l) => l.ownerId === db.me.seeker.id);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.briefs
      .filter((b) => !term || `${b.brand} ${b.industry} ${b.about}`.toLowerCase().includes(term))
      .filter((b) => !sport || b.sports.length === 0 || b.sports.includes(sport))
      .filter((b) => !objective || b.objectives.includes(objective as (typeof OBJECTIVES)[number]))
      .map((b) => ({ b, fit: myListings.length ? Math.max(...myListings.map((l) => fitScore(l, b).score)) : undefined }))
      .sort((a, z) => (z.fit ?? 0) - (a.fit ?? 0));
  }, [db, q, sport, objective, myListings]);

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Sponsor briefs</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">Brands looking to back sport</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">These brands have said what they want to sponsor and their budget.{mounted && myListings.length ? " Fit scores compare each brief with your listing." : ""} Open one and send a pitch.</p>

      <div className="card mt-8 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="relative">
          <span className="sr-only">Search brands</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden="true" />
          <input type="search" className="field pl-10" placeholder="Search brand or industry…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label><span className="sr-only">Sport</span>
          <select className="field" value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">Any sport</option>
            {SPORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Objective</span>
          <select className="field" value={objective} onChange={(e) => setObjective(e.target.value)}>
            <option value="">Any objective</option>
            {OBJECTIVES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-6 text-sm text-ink-mute" aria-live="polite">{rows.length} brief{rows.length === 1 ? "" : "s"}</p>
      {rows.length ? (
        <div className="mt-3 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ b, fit }) => <BriefCard key={b.id} b={b} fit={mounted ? fit : undefined} />)}
        </div>
      ) : (
        <div className="mt-3"><Empty title="No briefs match">Try another sport or objective.</Empty></div>
      )}
    </div>
  );
}
