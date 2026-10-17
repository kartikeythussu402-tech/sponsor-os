"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LoginNeeded, useMounted } from "@/components/ui";
import { uid } from "@/lib/format";
import { actions, getDB, useDB } from "@/lib/store";
import { FORMATS, KIND_LABEL, KINDS, LEVELS, SPORTS, STATES, type Format, type Kind, type Level, type Listing, type Package } from "@/lib/types";

type Draft = Omit<Listing, "id" | "createdAt" | "ownerId"> & { id?: string };

function blank(): Draft {
  const me = getDB().me.seeker;
  return {
    kind: me.kind,
    title: me.name,
    sport: me.sport,
    level: "district",
    city: me.city,
    state: me.state,
    dates: "",
    headline: "",
    story: "",
    audience: { attendance: 0, instagram: 0, youtube: 0, whatsapp: 0, demographic: "" },
    formats: ["Jersey / kit logo", "Banners & boundary boards", "Social media posts"],
    packages: [
      { id: uid("p"), name: "Supporter", price: 15000, deliverables: ["Logo on banners at every match", "2 social media posts"] },
      { id: uid("p"), name: "Kit Sponsor", price: 50000, deliverables: ["Logo on jersey", "Sampling stall at home games", "6 social media posts"] },
    ],
    goal: 100000,
    acceptsInKind: true,
    contactName: "",
    pastSponsors: "",
  };
}

const num = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

function Editor() {
  const params = useSearchParams();
  const id = params.get("id");
  const isNew = params.get("new") === "1";
  const db = useDB();
  const router = useRouter();
  const mounted = useMounted();
  const mine = db.listings.filter((l) => l.ownerId === db.me.seeker.id);
  const existing = id ? mine.find((l) => l.id === id) : !isNew && mine.length >= 1 ? mine[0] : undefined;
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (db.role !== "seeker") return <LoginNeeded role="seeker" what="Creating a sponsorship listing" />;

  const draft: Draft = d ?? (existing ? { ...existing } : blank());
  const set = (patch: Partial<Draft>) => setD({ ...draft, ...patch });
  const setAud = (patch: Partial<Draft["audience"]>) => set({ audience: { ...draft.audience, ...patch } });
  const setPkg = (i: number, patch: Partial<Package>) => set({ packages: draft.packages.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const validate = (): string[] => {
    const e: string[] = [];
    if (!draft.title.trim()) e.push("Add a name for your team, athlete or event.");
    if (!draft.headline.trim()) e.push("Add a one-line headline.");
    if (draft.story.trim().length < 40) e.push("Tell your story in at least a couple of sentences (40+ characters).");
    if (!draft.city.trim()) e.push("Add your city.");
    if (!draft.contactName.trim()) e.push("Add a contact name.");
    if (!draft.packages.length) e.push("Add at least one sponsorship package.");
    draft.packages.forEach((p, i) => {
      if (!p.name.trim()) e.push(`Package ${i + 1} needs a name.`);
      if (p.price < 500) e.push(`Package ${i + 1} needs a price of at least ₹500.`);
      if (!p.deliverables.filter((x) => x.trim()).length) e.push(`Package ${i + 1} needs at least one deliverable.`);
    });
    if (draft.goal < 500) e.push("Set your total funding goal.");
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (e.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const clean: Draft = {
      ...draft,
      id: existing?.id,
      packages: draft.packages.map((p) => ({ ...p, name: p.name.trim(), deliverables: p.deliverables.map((x) => x.trim()).filter(Boolean) })),
    };
    setSaving(true);
    try {
      const newId = await actions.saveListing(clean);
      router.push(`/listing/?id=${newId}`);
    } catch (err) {
      setErrors([(err as Error).message]);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const fmtToggle = (f: Format) => set({ formats: draft.formats.includes(f) ? draft.formats.filter((x) => x !== f) : [...draft.formats, f] });

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">{existing ? "Edit listing" : "New listing"}</p>
      <h1 className="display mt-2 text-4xl uppercase">{existing ? "Update your pitch" : "Pitch your game"}</h1>
      <p className="mt-3 text-ink-soft">Brands decide on three things: your story, your real reach, and clear packages with prices. Keep it honest and specific.</p>
      {mine.length > 0 && (
        <p className="mt-3 text-sm text-ink-soft">
          {existing ? <><Link className="font-semibold text-turf-3 underline" href="/listing/edit/?new=1">+ Create another listing</Link>{mine.length > 1 && " · Your listings: "}</> : "Your listings: "}
          {(existing && mine.length === 1 ? [] : mine).map((l, i) => (
            <span key={l.id}>{i > 0 && ", "}<Link className="font-semibold text-turf-3 underline" href={`/listing/edit/?id=${l.id}`}>{l.title}</Link></span>
          ))}
        </p>
      )}

      {errors.length > 0 && (
        <div role="alert" className="mt-6 rounded-2xl border border-danger/30 bg-white p-4 text-sm">
          <p className="font-semibold text-danger">Almost there:</p>
          <ul className="mt-1 list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <form className="mt-8 flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="display-tight text-xl">1 · Who you are</h2>
          <div>
            <span className="field-label">You are a…</span>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button key={k} type="button" className="pill-btn" aria-pressed={draft.kind === k} onClick={() => set({ kind: k as Kind })}>{KIND_LABEL[k]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="t">Name</label>
            <input id="t" className="field" value={draft.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Rohtak Rangers Kabaddi Club" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="sp">Sport</label>
              <select id="sp" className="field" value={draft.sport} onChange={(e) => set({ sport: e.target.value })}>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="field-label" htmlFor="lv">Level</label>
              <select id="lv" className="field capitalize" value={draft.level} onChange={(e) => set({ level: e.target.value as Level })}>{LEVELS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
            </div>
            <div>
              <label className="field-label" htmlFor="ct">Contact name</label>
              <input id="ct" className="field" value={draft.contactName} maxLength={60} onChange={(e) => set({ contactName: e.target.value })} placeholder="Coach / manager" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="cy">City</label>
              <input id="cy" className="field" value={draft.city} maxLength={40} onChange={(e) => set({ city: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="st">State</label>
              <select id="st" className="field" value={draft.state} onChange={(e) => set({ state: e.target.value })}>{STATES.filter((s) => s !== "Pan-India").map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="field-label" htmlFor="dt">Dates / season</label>
              <input id="dt" className="field" value={draft.dates} maxLength={80} onChange={(e) => set({ dates: e.target.value })} placeholder="e.g. 12–18 Jan 2027" />
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="display-tight text-xl">2 · Your story</h2>
          <div>
            <label className="field-label" htmlFor="hl">One-line headline</label>
            <input id="hl" className="field" value={draft.headline} maxLength={120} onChange={(e) => set({ headline: e.target.value })} placeholder="e.g. Haryana's loudest village kabaddi crowds — back our season." />
          </div>
          <div>
            <label className="field-label" htmlFor="sy">Story — why should a brand back you?</label>
            <textarea id="sy" className="field" rows={5} value={draft.story} maxLength={1500} onChange={(e) => set({ story: e.target.value })} placeholder="Who you are, what you've achieved, who comes to watch, and what the money will pay for." />
            <p className="mt-1 text-right text-xs text-ink-mute">{draft.story.length}/1500</p>
          </div>
          <div>
            <label className="field-label" htmlFor="ps">Past sponsors <span className="font-normal text-ink-mute">(optional)</span></label>
            <input id="ps" className="field" value={draft.pastSponsors} maxLength={160} onChange={(e) => set({ pastSponsors: e.target.value })} />
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="display-tight text-xl">3 · Reach</h2>
          <p className="-mt-2 text-sm text-ink-mute">Real numbers only — brands will check.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {([
              ["attendance", "People on ground (season)"],
              ["instagram", "Instagram followers"],
              ["youtube", "YouTube subscribers"],
              ["whatsapp", "WhatsApp community"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <label className="field-label" htmlFor={k}>{label}</label>
                <input id={k} inputMode="numeric" className="field" value={draft.audience[k] || ""} onChange={(e) => setAud({ [k]: num(e.target.value) })} placeholder="0" />
              </div>
            ))}
          </div>
          <div>
            <label className="field-label" htmlFor="dm">Who is your audience?</label>
            <input id="dm" className="field" value={draft.audience.demographic} maxLength={200} onChange={(e) => setAud({ demographic: e.target.value })} placeholder="e.g. Men & women 15–35, rural Haryana, families on weekends" />
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="display-tight text-xl">4 · What you can offer</h2>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button key={f} type="button" className="pill-btn" aria-pressed={draft.formats.includes(f)} onClick={() => fmtToggle(f)}>{f}</button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-[#123d2a]" checked={draft.acceptsInKind} onChange={(e) => set({ acceptsInKind: e.target.checked })} />
            We also accept in-kind support (kit, drinks, travel, equipment)
          </label>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display-tight text-xl">5 · Packages</h2>
            <span className="text-sm text-ink-mute">{draft.packages.length}/4</span>
          </div>
          {draft.packages.map((p, i) => (
            <fieldset key={p.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-chalk/50 p-4">
              <legend className="px-1 text-sm font-bold text-ink-soft">Package {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
                <div>
                  <label className="field-label" htmlFor={`pn${i}`}>Name</label>
                  <input id={`pn${i}`} className="field" value={p.name} maxLength={40} onChange={(e) => setPkg(i, { name: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" htmlFor={`pp${i}`}>Price (₹)</label>
                  <input id={`pp${i}`} inputMode="numeric" className="field" value={p.price || ""} onChange={(e) => setPkg(i, { price: num(e.target.value) })} />
                </div>
                <button type="button" className="btn btn-ghost text-danger" disabled={draft.packages.length === 1} onClick={() => set({ packages: draft.packages.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} aria-hidden="true" /> Remove
                </button>
              </div>
              <div>
                <label className="field-label" htmlFor={`pd${i}`}>Deliverables — one per line</label>
                <textarea id={`pd${i}`} className="field" rows={3} value={p.deliverables.join("\n")} onChange={(e) => setPkg(i, { deliverables: e.target.value.split("\n") })} />
              </div>
            </fieldset>
          ))}
          {draft.packages.length < 4 && (
            <button type="button" className="btn btn-secondary self-start" onClick={() => set({ packages: [...draft.packages, { id: uid("p"), name: "", price: 0, deliverables: [""] }] })}>
              <Plus size={16} aria-hidden="true" /> Add package
            </button>
          )}
          <div className="max-w-xs">
            <label className="field-label" htmlFor="gl">Total funding goal (₹)</label>
            <input id="gl" inputMode="numeric" className="field" value={draft.goal || ""} onChange={(e) => set({ goal: num(e.target.value) })} />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {existing ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-danger">Delete listing and its deals?</span>
                <button type="button" className="btn btn-danger btn-sm" onClick={async () => {
                    try {
                      await actions.deleteListing(existing.id);
                      router.push("/dashboard/");
                    } catch (err) {
                      setErrors([(err as Error).message]);
                      setConfirmDelete(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}>Yes, delete</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" /> Delete</button>
            )
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Publish listing"}</button>
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
