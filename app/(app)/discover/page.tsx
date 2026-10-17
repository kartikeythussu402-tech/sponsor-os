"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ListingCard } from "@/components/cards";
import { Empty, useMounted } from "@/components/ui";
import { bestFit } from "@/lib/fit";
import { useDB } from "@/lib/store";
import { KIND_LABEL, KINDS, LEVELS, SPORTS, STATES } from "@/lib/types";

const BUDGETS = [
  ["", "Any budget"],
  ["25000", "Packages under ₹25k"],
  ["75000", "Under ₹75k"],
  ["150000", "Under ₹1.5L"],
] as const;

export default function DiscoverPage() {
  const db = useDB();
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [state, setState] = useState("");
  const [kind, setKind] = useState("");
  const [level, setLevel] = useState("");
  const [budget, setBudget] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState<"fit" | "new" | "reach" | "price">("fit");

  const myBriefs = db.briefs.filter((b) => b.ownerId === db.me.sponsor.id);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = db.listings
      .filter((l) => !term || `${l.title} ${l.headline} ${l.city} ${l.sport}`.toLowerCase().includes(term))
      .filter((l) => !sport || l.sport === sport)
      .filter((l) => !state || l.state === state)
      .filter((l) => !kind || l.kind === kind)
      .filter((l) => !level || l.level === level)
      .filter((l) => !budget || Math.min(...l.packages.map((p) => p.price)) <= Number(budget))
      .filter((l) => !onlySaved || db.saved.includes(l.id))
      .map((l) => ({ l, fit: myBriefs.length ? bestFit(l, myBriefs) : null }));
    const reach = (x: (typeof list)[number]) => x.l.audience.attendance + x.l.audience.instagram + x.l.audience.youtube + x.l.audience.whatsapp;
    return list.sort((a, b) =>
      sort === "fit"
        ? (b.fit?.score ?? 0) - (a.fit?.score ?? 0)
        : sort === "new"
          ? b.l.createdAt.localeCompare(a.l.createdAt)
          : sort === "reach"
            ? reach(b) - reach(a)
            : Math.min(...a.l.packages.map((p) => p.price)) - Math.min(...b.l.packages.map((p) => p.price)),
    );
  }, [db, q, sport, state, kind, level, budget, onlySaved, sort, myBriefs]);

  const clear = () => {
    [setQ, setSport, setState, setKind, setLevel, setBudget].forEach((f) => f(""));
    setOnlySaved(false);
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Discover</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">Who needs a sponsor?</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {myBriefs.length ? (
          <>Fit scores compare each listing with your brief{myBriefs.length > 1 ? "s" : ""} — sport, region, budget, formats and level.</>
        ) : (
          <>
            <Link href="/brief/edit/" className="font-semibold text-turf-3 underline">Post a sponsor brief</Link> to get a fit score on every listing.
          </>
        )}
      </p>

      <div className="card mt-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden="true" />
          <input type="search" className="field pl-10" placeholder="Search team, city, sport…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label><span className="sr-only">Sport</span>
          <select className="field" value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">All sports</option>
            {SPORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span className="sr-only">State</span>
          <select className="field" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All states</option>
            {STATES.filter((s) => s !== "Pan-India").map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Type</span>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Budget</span>
          <select className="field" value={budget} onChange={(e) => setBudget(e.target.value)}>
            {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6">
          <SlidersHorizontal size={16} className="text-ink-mute" aria-hidden="true" />
          {LEVELS.map((lv) => (
            <button key={lv} type="button" className="pill-btn capitalize" aria-pressed={level === lv} onClick={() => setLevel(level === lv ? "" : lv)}>
              {lv}
            </button>
          ))}
          <button type="button" className="pill-btn" aria-pressed={onlySaved} onClick={() => setOnlySaved((v) => !v)}>
            Shortlisted ({mounted ? db.saved.length : 0})
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
            Sort
            <select className="field min-h-10 w-auto py-0 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="fit">Best fit</option>
              <option value="new">Newest</option>
              <option value="reach">Biggest reach</option>
              <option value="price">Lowest entry price</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-mute" aria-live="polite">
        {rows.length} opportunit{rows.length === 1 ? "y" : "ies"}
      </p>
      {rows.length ? (
        <div className="mt-3 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ l, fit }) => (
            <ListingCard key={l.id} l={l} fit={mounted && fit ? fit.score : undefined} showSave={mounted && db.role === "sponsor"} />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <Empty title="Nothing matches those filters" action={<button type="button" className="btn btn-secondary" onClick={clear}>Clear filters</button>}>
            Try a wider budget or another state.
          </Empty>
        </div>
      )}
    </div>
  );
}
