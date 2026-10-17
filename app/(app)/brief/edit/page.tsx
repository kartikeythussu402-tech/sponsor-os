"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BriefCard } from "@/components/cards";
import { LoginNeeded, useMounted } from "@/components/ui";
import { actions, useDB } from "@/lib/store";
import { FORMATS, LEVELS, OBJECTIVES, SPORTS, STATES, type Brief } from "@/lib/types";

type Draft = Omit<Brief, "id" | "createdAt" | "ownerId" | "brand" | "industry"> & { id?: string };
const num = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function blank(): Draft {
  return {
    about: "",
    sports: [],
    states: [],
    levels: [],
    budgetMin: 20000,
    budgetMax: 100000,
    objectives: ["Brand awareness"],
    formats: [],
    deadline: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  };
}

function Editor() {
  const params = useSearchParams();
  const id = params.get("id");
  const isNew = params.get("new") === "1";
  const db = useDB();
  const router = useRouter();
  const mounted = useMounted();
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (db.role !== "sponsor") return <LoginNeeded role="sponsor" what="Posting a sponsor brief" />;

  const mine = db.briefs.filter((b) => b.ownerId === db.me.sponsor.id);
  const existing = id ? mine.find((b) => b.id === id) : undefined;

  // List view: /brief/edit/ with no id → show my briefs + "new" button
  if (!id && !isNew && mine.length) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-turf-3">{db.me.sponsor.brand}</p>
            <h1 className="display mt-2 text-4xl uppercase">My sponsor briefs</h1>
          </div>
          <Link href="/brief/edit/?new=1" className="btn btn-primary"><Plus size={16} aria-hidden="true" /> New brief</Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mine.map((b) => <BriefCard key={b.id} b={b} />)}
        </div>
      </div>
    );
  }

  const draft: Draft = d ?? (existing ? { ...existing } : blank());
  const set = (patch: Partial<Draft>) => setD({ ...draft, ...patch });

  const save = async () => {
    const e: string[] = [];
    if (draft.about.trim().length < 20) e.push("Describe what you're looking for (20+ characters).");
    if (draft.budgetMin < 500) e.push("Set a minimum budget of at least ₹500.");
    if (draft.budgetMax < draft.budgetMin) e.push("Maximum budget must be at least the minimum.");
    if (!draft.objectives.length) e.push("Pick at least one objective.");
    if (!draft.deadline) e.push("Choose a pitch deadline.");
    setErrors(e);
    if (e.length) return window.scrollTo({ top: 0, behavior: "smooth" });
    setSaving(true);
    try {
      const newId = await actions.saveBrief({ ...draft, id: existing?.id, about: draft.about.trim() });
      router.push(`/brief/?id=${newId}`);
    } catch (err) {
      setErrors([(err as Error).message]);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">{existing ? "Edit brief" : "New sponsor brief"}</p>
      <h1 className="display mt-2 text-4xl uppercase">What do you want to sponsor?</h1>
      <p className="mt-3 text-ink-soft">Posted as <strong className="text-ink">{db.me.sponsor.brand}</strong> ({db.me.sponsor.industry}). Seekers will see this and pitch you; you’ll also get fit scores on every listing.</p>
      {errors.length > 0 && (
        <div role="alert" className="mt-6 rounded-2xl border border-danger/30 bg-white p-4 text-sm">
          <ul className="list-disc pl-5 text-danger">{errors.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      <form className="mt-8 flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <section className="card flex flex-col gap-4 p-6">
          <label className="field-label" htmlFor="ab">About this brief</label>
          <textarea id="ab" className="-mt-3 field" rows={4} maxLength={600} value={draft.about} onChange={(e) => set({ about: e.target.value })} placeholder="e.g. New energy drink launching in North India — we want sampling at crowded local matches." />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="bmin">Min budget (₹)</label>
              <input id="bmin" inputMode="numeric" className="field" value={draft.budgetMin || ""} onChange={(e) => set({ budgetMin: num(e.target.value) })} />
            </div>
            <div>
              <label className="field-label" htmlFor="bmax">Max budget (₹)</label>
              <input id="bmax" inputMode="numeric" className="field" value={draft.budgetMax || ""} onChange={(e) => set({ budgetMax: num(e.target.value) })} />
            </div>
            <div>
              <label className="field-label" htmlFor="dl">Pitch deadline</label>
              <input id="dl" type="date" className="field" value={draft.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </div>
          </div>
        </section>
        <section className="card flex flex-col gap-3 p-6">
          <h2 className="field-label">Sports <span className="font-normal text-ink-mute">(none selected = any sport)</span></h2>
          <div className="flex flex-wrap gap-2">
            {SPORTS.filter((s) => s !== "Other").map((s) => <button key={s} type="button" className="pill-btn" aria-pressed={draft.sports.includes(s)} onClick={() => set({ sports: toggle(draft.sports, s) })}>{s}</button>)}
          </div>
        </section>
        <section className="card flex flex-col gap-3 p-6">
          <h2 className="field-label">Regions <span className="font-normal text-ink-mute">(none = Pan-India)</span></h2>
          <div className="flex flex-wrap gap-2">
            {STATES.map((s) => <button key={s} type="button" className="pill-btn" aria-pressed={draft.states.includes(s)} onClick={() => set({ states: toggle(draft.states, s) })}>{s}</button>)}
          </div>
        </section>
        <section className="card flex flex-col gap-4 p-6">
          <div>
            <h2 className="field-label">Objectives</h2>
            <div className="flex flex-wrap gap-2">{OBJECTIVES.map((s) => <button key={s} type="button" className="pill-btn" aria-pressed={draft.objectives.includes(s)} onClick={() => set({ objectives: toggle(draft.objectives, s) })}>{s}</button>)}</div>
          </div>
          <div>
            <h2 className="field-label">Preferred formats</h2>
            <div className="flex flex-wrap gap-2">{FORMATS.map((s) => <button key={s} type="button" className="pill-btn" aria-pressed={draft.formats.includes(s)} onClick={() => set({ formats: toggle(draft.formats, s) })}>{s}</button>)}</div>
          </div>
          <div>
            <h2 className="field-label">Level <span className="font-normal text-ink-mute">(none = any)</span></h2>
            <div className="flex flex-wrap gap-2">{LEVELS.map((s) => <button key={s} type="button" className="pill-btn capitalize" aria-pressed={draft.levels.includes(s)} onClick={() => set({ levels: toggle(draft.levels, s) })}>{s}</button>)}</div>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {existing ? (
            <button type="button" className="btn btn-ghost text-danger" onClick={async () => {
              if (!confirm("Delete this brief?")) return;
              try {
                await actions.deleteBrief(existing.id);
                router.push("/brief/edit/");
              } catch (err) {
                setErrors([(err as Error).message]);
              }
            }}>
              <Trash2 size={16} aria-hidden="true" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? "Saving…" : existing ? "Save brief" : "Post brief"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" aria-hidden="true" />}>
      <Editor />
    </Suspense>
  );
}
