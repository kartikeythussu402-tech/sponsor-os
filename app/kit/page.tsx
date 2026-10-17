"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Printer } from "lucide-react";
import { KindTag, Logo, Progress, ReachRow, SportBadge, useMounted } from "@/components/ui";
import { inr, totalReach } from "@/lib/format";
import { raisedFor, useDB } from "@/lib/store";

function Kit() {
  const db = useDB();
  const mounted = useMounted();
  const id = useSearchParams().get("id");
  if (!mounted) return <div className="h-svh" aria-hidden="true" />;
  const l = db.listings.find((x) => x.id === id) ?? db.listings[0];
  if (!l) return <p className="p-10">Listing not found.</p>;
  const sponsors = db.backers[l.id] ?? [];
  const past = [...new Set([...l.pastSponsors.split(/[,;·]/).map((x) => x.trim()).filter(Boolean), ...sponsors])];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 print:p-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/listing/?id=${l.id}`} className="btn btn-ghost btn-sm">← Back to listing</Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print / Save as PDF</button>
      </div>

      <article className="overflow-hidden rounded-3xl border border-line bg-paper shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="striped bg-turf p-8 text-white sm:p-12">
          <div className="flex items-center justify-between gap-4">
            <Logo light />
            <span className="eyebrow text-lime">Sponsorship proposal</span>
          </div>
          <div className="mt-10 flex items-start gap-5">
            <SportBadge sport={l.sport} size={64} />
            <div className="min-w-0">
              <KindTag kind={l.kind} />
              <h1 className="display mt-2 text-4xl uppercase leading-[0.95] sm:text-5xl">{l.title}</h1>
              <p className="mt-2 text-white/80">{l.sport} · {l.city}, {l.state} · {l.dates}</p>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-xl leading-snug">{l.headline}</p>
        </header>

        <section className="grid gap-8 p-8 sm:grid-cols-[1.4fr_1fr] sm:p-12">
          <div>
            <h2 className="eyebrow text-turf-3">Our story</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{l.story}</p>
            {past.length > 0 && (
              <>
                <h2 className="eyebrow mt-8 text-turf-3">Backed by</h2>
                <p className="mt-2 font-semibold">{past.join(" · ")}</p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl bg-chalk p-5">
              <h2 className="eyebrow text-turf-3">Reach</h2>
              <p className="stat-num mt-1 text-4xl">{totalReach(l.audience).toLocaleString("en-IN")}</p>
              <div className="mt-3"><ReachRow a={l.audience} /></div>
              {l.audience.demographic && <p className="mt-3 text-sm text-ink-soft">{l.audience.demographic}</p>}
            </div>
            <div className="rounded-2xl bg-chalk p-5">
              <h2 className="eyebrow text-turf-3">Funding</h2>
              <div className="mt-3"><Progress value={raisedFor(db, l.id)} goal={l.goal} /></div>
              {l.acceptsInKind && <p className="mt-3 text-sm text-ink-soft">In-kind support (kit, travel, nutrition) welcome.</p>}
            </div>
          </div>
        </section>

        <section className="border-t border-line p-8 sm:p-12">
          <h2 className="display-tight text-2xl">Packages</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {l.packages.map((p, i) => (
              <div key={p.id} className={`break-inside-avoid rounded-2xl border p-5 ${i === l.packages.length - 1 && l.packages.length > 1 ? "border-turf bg-turf/5" : "border-line"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="display-tight text-lg">{p.name}</h3>
                  <span className="stat-num text-xl">{inr(p.price)}</span>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {p.deliverables.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-mute">Formats available: {l.formats.join(", ")}</p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 bg-ink p-8 text-white sm:px-12">
          <div>
            <p className="eyebrow text-lime">Let&apos;s talk</p>
            <p className="mt-1 text-lg font-semibold">{l.contactName}</p>
          </div>
          <p className="text-sm text-white/70">Reply via Sponsor OS · listing {l.id}</p>
        </footer>
      </article>
    </main>
  );
}

export default function KitPage() {
  return (
    <Suspense fallback={<div className="h-svh" />}>
      <Kit />
    </Suspense>
  );
}
