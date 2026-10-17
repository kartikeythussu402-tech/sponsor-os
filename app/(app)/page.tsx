"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, FileText, Handshake, Megaphone, Radar, Share2 } from "lucide-react";
import { ListingCard } from "@/components/cards";
import { SportBadge, useMounted } from "@/components/ui";
import { inrShort } from "@/lib/format";
import { useDB } from "@/lib/store";
import type { Role } from "@/lib/types";

export default function Home() {
  const db = useDB();
  const router = useRouter();
  const go = (role: Role, href: string) => {
    if (!db.user) router.push(`/signup/?role=${role}`);
    else router.push(db.role === role ? href : "/dashboard/");
  };
  const ready = useMounted();
  const picks = ["ls_malabar", "ls_dharavi", "ls_ananya"].map((id) => db.listings.find((l) => l.id === id)).filter(Boolean) as typeof db.listings;
  const featured = picks.length === 3 ? picks : [...picks, ...db.listings.filter((l) => !picks.includes(l))].slice(0, 3);
  const sports = Array.from(new Set(db.listings.map((l) => l.sport)));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-turf text-white">
        <div className="striped pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full border-[28px] border-white/5" aria-hidden="true" />
        <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:py-24">
          <div className="animate-rise flex flex-col gap-6">
            <p className="eyebrow text-lime">The sponsorship desk for grassroots sport</p>
            <h1 className="display text-[46px] uppercase sm:text-7xl lg:text-[84px]">
              Get your
              <br />
              game <span className="text-lime">funded.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/85">
              Athletes, teams, tournaments and leagues list what they offer. Brands find the right fit, send offers and track every deliverable — in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-lime btn-lg" onClick={() => go("seeker", "/listing/edit/")}>
                I need a sponsor <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-lg border border-white/30 text-white hover:bg-white/10" onClick={() => go("sponsor", "/discover/")}>
                I want to sponsor
              </button>
            </div>
            <p className="text-sm text-white/65">Free to list. Escrow-protected payments · 5% fee only when a deal pays out.</p>
          </div>

          {/* Hero visual: a mini sponsorship kit */}
          <div className="animate-rise relative mx-auto w-full max-w-md" style={{ animationDelay: "150ms" }} aria-hidden="true">
            <div className="absolute -left-6 top-10 hidden w-48 -rotate-6 rounded-2xl bg-paper p-4 text-ink shadow-[var(--shadow-pop)] sm:block">
              <p className="eyebrow text-turf-3">New offer</p>
              <p className="display-tight mt-1 text-base leading-tight">Pragati Cement → Kit Sponsor</p>
              <p className="stat-num mt-2 text-2xl">₹75,000</p>
              <span className="mt-2 inline-flex rounded-full bg-lime px-2 py-0.5 text-xs font-bold">Accepted</span>
            </div>
            <div className="rotate-2 rounded-3xl bg-paper p-6 text-ink shadow-[var(--shadow-pop)] sm:ml-16">
              <div className="flex items-center gap-3">
                <SportBadge sport="Kabaddi" size={48} />
                <div>
                  <p className="display-tight text-lg leading-tight">Rohtak Rangers</p>
                  <p className="text-xs text-ink-mute">Kabaddi · Haryana · State level</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4 text-center">
                {[["28k", "on ground"], ["18k", "Instagram"], ["14", "matches"]].map(([n, l]) => (
                  <div key={l}>
                    <p className="stat-num text-2xl">{n}</p>
                    <p className="text-[11px] text-ink-mute">{l}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {[["Matchday Partner", "₹25k"], ["Kit Sponsor", "₹75k"], ["Title Sponsor", "₹2L"]].map(([n, p]) => (
                  <li key={n} className="flex items-center justify-between rounded-xl bg-chalk px-3 py-2">
                    <span className="font-semibold">{n}</span>
                    <span className="stat-num">{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-chalk-2">
                <div className="h-full w-1/4 rounded-full bg-turf-3" />
              </div>
              <p className="mt-1.5 text-xs text-ink-mute">₹75k committed of ₹3L goal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports strip */}
      <section className="border-b border-line bg-paper">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
          <p className="eyebrow text-ink-mute">On the board now</p>
          {sports.map((s) => (
            <span key={s} className="flex items-center gap-2 text-sm font-semibold">
              <SportBadge sport={s} size={26} />
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Two sides */}
      <section className="container-page grid gap-5 py-16 sm:py-20 md:grid-cols-2">
        <div className="card flex flex-col gap-5 p-7 sm:p-9">
          <p className="eyebrow text-clay">For athletes, teams, tournaments & leagues</p>
          <h2 className="display text-4xl uppercase">Pitch like a pro.</h2>
          <ul className="flex flex-col gap-4 text-ink-soft">
            {[
              [FileText, "Build a sponsorship listing in 5 minutes — your story, real reach numbers and priced packages."],
              [Share2, "Get a printable sponsorship deck page you can share on WhatsApp or email to any brand."],
              [Megaphone, "Browse brands that have posted what they want to sponsor, and pitch the ones that fit."],
            ].map(([I, t], i) => {
              const Icon = I as typeof FileText;
              return (
                <li key={i} className="flex gap-3">
                  <Icon size={20} className="mt-0.5 shrink-0 text-turf-3" aria-hidden="true" />
                  <span>{t as string}</span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="btn btn-primary mt-auto self-start" onClick={() => go("seeker", "/listing/edit/")}>
            Create my listing
          </button>
        </div>
        <div className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-ink p-7 text-white shadow-[var(--shadow-card)] sm:p-9">
          <p className="eyebrow text-lime">For brands & local businesses</p>
          <h2 className="display text-4xl uppercase">Back the right team.</h2>
          <ul className="flex flex-col gap-4 text-white/80">
            {[
              [Radar, "Filter by sport, state, level and budget — every listing gets a fit score against your brief."],
              [Handshake, "Send an offer on a package, negotiate in one thread, accept with a click."],
              [BadgeCheck, "Track deliverables — logos, banners, posts — with proof notes, until the deal is done."],
            ].map(([I, t], i) => {
              const Icon = I as typeof Radar;
              return (
                <li key={i} className="flex gap-3">
                  <Icon size={20} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
                  <span>{t as string}</span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="btn btn-lime mt-auto self-start" onClick={() => go("sponsor", "/discover/")}>
            Discover opportunities
          </button>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-turf-3">Looking for sponsors</p>
            <h2 className="display mt-2 text-4xl uppercase">Fresh on the board</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => go("sponsor", "/discover/")}>
            See all{ready ? ` ${db.listings.length}` : ""} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {!ready && [0, 1, 2].map((i) => <div key={i} className="card h-72 animate-pulse bg-chalk-2/60" aria-hidden="true" />)}
          {featured.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-mute">Sample listings — all names are fictional.</p>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-chalk-2/60">
        <div className="container-page py-16 sm:py-20">
          <h2 className="display text-4xl uppercase">From listing to logo-on-jersey</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {[
              ["List", "Seeker creates a listing with packages — e.g. Kit Sponsor ₹75,000."],
              ["Match", "Brands see a fit score against their brief and shortlist."],
              ["Deal", "Offer, counter, accept — all in one thread with a clear amount."],
              ["Deliver", "A checklist of deliverables with proof, so both sides know it's done."],
            ].map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-2 border-t-2 border-ink pt-4">
                <span className="stat-num text-3xl text-turf-3">0{i + 1}</span>
                <h3 className="display-tight text-xl">{t}</h3>
                <p className="text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-lime px-6 py-12 text-center sm:px-12">
          <h2 className="display text-4xl uppercase sm:text-5xl">{ready ? `${inrShort(db.listings.reduce((s, l) => s + l.goal, 0))} of sport` : "Sport"} waiting to be backed.</h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-soft">Total goal across the sample listings on the board today.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => go("seeker", "/listing/edit/")}>I need a sponsor</button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => go("sponsor", "/discover/")}>I want to sponsor</button>
          </div>
        </div>
      </section>
    </>
  );
}
