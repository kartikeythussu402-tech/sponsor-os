"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useDB, useLoadState } from "@/lib/store";
import { fitTone } from "@/lib/fit";
import { count, inrShort } from "@/lib/format";
import { KIND_LABEL, type Kind, type Listing, type Role } from "@/lib/types";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#123d2a" />
      <path d="M11 27.5c2.4 1.6 5.2 2.4 8.3 2.4 4.6 0 7.6-2.3 7.6-5.8 0-3.1-2.1-4.6-6.6-5.6l-2.3-.5c-2.1-.5-2.9-1-2.9-2 0-1.1 1.1-1.8 2.9-1.8 1.9 0 3.6.6 5.1 1.7l2.2-3.2c-2-1.5-4.4-2.3-7.2-2.3-4.4 0-7.3 2.4-7.3 5.8 0 3.2 2.2 4.6 6.4 5.5l2.3.5c2.2.5 3 1 3 2.1 0 1.2-1.2 2-3.3 2-2.4 0-4.5-.8-6.3-2.2z" fill="#d6f548" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex min-h-11 items-center gap-2.5 ${light ? "text-white" : "text-ink"}`} aria-label="Sponsor OS home">
      <LogoMark />
      <span className="display-tight text-[19px] uppercase" style={{ fontStretch: "120%" }}>
        Sponsor<span className={light ? "text-lime" : "text-turf-3"}>OS</span>
      </span>
    </Link>
  );
}

const SPORT_COLORS: Record<string, [string, string]> = {
  Cricket: ["#1d5a3e", "#d6f548"],
  Football: ["#2b5c8a", "#ffffff"],
  Kabaddi: ["#b8471c", "#ffffff"],
  Hockey: ["#123d2a", "#d6f548"],
  Wrestling: ["#7a2e1a", "#f6dccd"],
  Boxing: ["#8b1e2d", "#ffffff"],
  Athletics: ["#c2e330", "#13201a"],
  Chess: ["#13201a", "#f4f1e8"],
  Basketball: ["#c75a12", "#ffffff"],
  "Ultimate Frisbee": ["#2f7a55", "#ffffff"],
};

export function SportBadge({ sport, size = 44 }: { sport: string; size?: number }) {
  const [bg, fg] = SPORT_COLORS[sport] ?? ["#46524b", "#ffffff"];
  const initials = sport
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="display-tight grid shrink-0 place-items-center rounded-xl"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36, fontStretch: "120%" }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function KindTag({ kind }: { kind: Kind }) {
  return <span className="chip">{KIND_LABEL[kind]}</span>;
}

export function FitBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const tone = fitTone(score);
  const cls = tone === "high" ? "bg-lime text-ink" : tone === "mid" ? "bg-chalk-2 text-ink" : "bg-clay-soft text-clay";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`} title="How well this matches your sponsor brief">
      <span className="stat-num text-sm">{score}</span>
      {!compact && <span>% fit</span>}
    </span>
  );
}

export function Progress({ value, goal, dark = false }: { value: number; goal: number; dark?: boolean }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-chalk-2"}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Sponsorship raised">
        <div className={`h-full rounded-full ${dark ? "bg-lime" : "bg-turf-3"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1.5 text-xs ${dark ? "text-white/80" : "text-ink-mute"}`}>
        <strong className={dark ? "text-white" : "text-ink"}>{inrShort(value)}</strong> committed of {inrShort(goal)} goal · {pct}%
      </p>
    </div>
  );
}

export function ReachRow({ a, light = false }: { a: Listing["audience"]; light?: boolean }) {
  const items = [
    ["On ground", a.attendance],
    ["Instagram", a.instagram],
    ["YouTube", a.youtube],
    ["WhatsApp", a.whatsapp],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className={`text-[11px] font-semibold uppercase tracking-wider ${light ? "text-white/70" : "text-ink-mute"}`}>{k}</dt>
          <dd className="stat-num text-lg">{count(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** True once the server state has loaded (pages render a placeholder until then). */
export function useMounted() {
  return useLoadState() === "ready";
}

/** Shown on pages that need an account (or a specific kind of account). */
export function LoginNeeded({ role, what }: { role?: Role; what: string }) {
  const db = useDB();
  const wrongRole = db.user && role && db.role !== role;
  return (
    <div className="container-page max-w-xl py-16">
      <Empty
        title={wrongRole ? (role === "seeker" ? "This is for teams & athletes" : "This is for brands") : "Log in to continue"}
        action={
          wrongRole ? (
            <Link href="/dashboard/" className="btn btn-primary">Go to your dashboard</Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/login/" className="btn btn-primary">Log in</Link>
              <Link href={`/signup/${role ? `?role=${role}` : ""}`} className="btn btn-secondary">Create an account</Link>
            </div>
          )
        }
      >
        {wrongRole
          ? `You're signed in as a ${db.role === "seeker" ? "team/athlete" : "brand"} account. ${what} needs a ${role === "seeker" ? "team/athlete" : "brand"} account.`
          : `${what} needs an account. It takes 30 seconds — or use a one-click demo login.`}
      </Empty>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h3 className="display-tight text-xl">{title}</h3>
      {children && <p className="max-w-md text-ink-soft">{children}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`animate-rise max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-[var(--shadow-pop)] sm:rounded-3xl sm:p-8 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="display-tight text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost -mr-2 -mt-1 w-11 px-0" aria-label="Close" autoFocus>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
