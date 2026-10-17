"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { auth, refresh, useDB, useLoadState } from "@/lib/store";
import type { Role } from "@/lib/types";
import { CONTACT } from "@/lib/contact";
import { Logo, useMounted } from "./ui";

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  seeker: [
    { href: "/dashboard/", label: "Dashboard" },
    { href: "/sponsors/", label: "Find sponsors" },
    { href: "/listing/edit/", label: "My listing" },
    { href: "/deals/", label: "Deals" },
  ],
  sponsor: [
    { href: "/dashboard/", label: "Dashboard" },
    { href: "/discover/", label: "Discover" },
    { href: "/brief/edit/", label: "My briefs" },
    { href: "/deals/", label: "Deals" },
  ],
};

const PUBLIC_NAV = [
  { href: "/discover/", label: "Discover" },
  { href: "/sponsors/", label: "Sponsor briefs" },
  { href: "/how-it-works/", label: "How it works" },
];

function Account({ mobile = false }: { mobile?: boolean }) {
  const db = useDB();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!db.user) {
    return (
      <div className={`flex gap-2 ${mobile ? "flex-col" : "items-center"}`}>
        <Link href="/login/" className="btn btn-ghost btn-sm">Log in</Link>
        <Link href="/signup/" className="btn btn-primary btn-sm">Sign up free</Link>
      </div>
    );
  }
  return (
    <div className={`flex gap-2 ${mobile ? "flex-col items-start" : "items-center"}`}>
      <Link href="/profile/" className="btn btn-ghost btn-sm max-w-56">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-turf text-xs font-bold text-lime" aria-hidden="true">
          {(db.role === "seeker" ? db.me.seeker.name : db.me.sponsor.brand).slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate">{db.role === "seeker" ? db.me.seeker.name : db.me.sponsor.brand}</span>
      </Link>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await auth.logout();
            router.push("/");
          } finally {
            setBusy(false);
          }
        }}
      >
        Log out
      </button>
    </div>
  );
}

export function SiteHeader() {
  const db = useDB();
  const mounted = useMounted();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);
  const role = mounted ? db.role : null;
  const nav = role ? NAV[role] : PUBLIC_NAV;
  const mine = (d: (typeof db.deals)[number]) => (role === "seeker" ? d.seekerId === db.me.seeker.id : d.sponsorId === db.me.sponsor.id);
  const openDeals = role ? db.deals.filter((d) => mine(d) && ["proposed", "negotiating"].includes(d.status)).length : 0;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-chalk/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined} className="btn btn-ghost btn-sm aria-[current=page]:bg-chalk-2">
              {n.label}
              {n.href === "/deals/" && openDeals > 0 && <span className="rounded-full bg-clay px-1.5 text-[11px] text-white">{openDeals}</span>}
            </Link>
          ))}
        </nav>
        <div className="hidden min-w-[180px] justify-end lg:flex">{mounted && <Account />}</div>
        <button type="button" className="btn btn-ghost w-11 px-0 lg:hidden" aria-expanded={open} aria-controls="mnav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mounted && db.user?.demo && (
        <div className="border-t border-line/70 bg-lime/40">
          <p className="container-page truncate py-1.5 text-xs text-ink-soft">
            Demo account · signed in as <strong className="text-ink">{role === "seeker" ? db.me.seeker.name : db.me.sponsor.brand}</strong> ({role === "seeker" ? "team" : "brand"}). Log out and use the other demo login to reply as the other side.
          </p>
        </div>
      )}
      {open && (
        <nav id="mnav" aria-label="Mobile" className="border-t border-line bg-paper lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="flex min-h-12 items-center justify-between rounded-lg px-2 text-lg font-semibold hover:bg-chalk-2">
                {n.label}
                {n.href === "/deals/" && openDeals > 0 && <span className="rounded-full bg-clay px-2 text-xs text-white">{openDeals} open</span>}
              </Link>
            ))}
            <div className="mt-2 border-t border-line pt-3">{mounted && <Account mobile />}</div>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Explains what to do when the deployment has no database yet, or the API is down. */
export function StatusGate({ children }: { children: React.ReactNode }) {
  const status = useLoadState();
  return (
    <>
      {status === "setup" && (
        <div className="container-page max-w-2xl pt-10">
          <div className="card p-8">
            <p className="eyebrow text-clay">One step left</p>
            <h1 className="display-tight mt-2 text-3xl">Connect the database</h1>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
              <li>Open this project on vercel.com → <strong>Storage</strong> tab.</li>
              <li>Click <strong>Create Database</strong> → choose <strong>Neon</strong> (free) → Continue → Create.</li>
              <li>Connect it to this project (all environments).</li>
              <li>Redeploy (run <code>npx vercel --prod</code> again). Tables and sample data are created automatically.</li>
            </ol>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="container-page pt-6">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-clay-soft px-5 py-4 text-clay">
            <p className="font-semibold">Couldn&apos;t reach the server. Check your connection and try again.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto bg-turf text-white">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-white/75">The sponsorship desk for grassroots sport — athletes, teams, tournaments and leagues meet the brands that want to back them.</p>
        </div>
        <div>
          <h2 className="eyebrow mb-3 text-lime">For seekers</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-white/85">
            <li><Link className="hover:text-white hover:underline" href="/listing/edit/">Create a sponsorship listing</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/sponsors/">Browse sponsor briefs</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/deals/">Track deals</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3 text-lime">For sponsors</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-white/85">
            <li><Link className="hover:text-white hover:underline" href="/discover/">Discover opportunities</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/brief/edit/">Post a sponsor brief</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/how-it-works/">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3 text-lime">Contact</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-white/85">
            <li><a className="break-all hover:text-white hover:underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a className="hover:text-white hover:underline" href={`tel:+${CONTACT.phoneRaw}`}>{CONTACT.phone}</a></li>
            <li><Link className="hover:text-white hover:underline" href="/contact/">Contact us</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-white/65">
          <p>© {new Date().getFullYear()} Sponsor OS · Sample teams, athletes and brands are fictional. Payments run in Razorpay test mode.</p>
          <Link href="/how-it-works/" className="underline underline-offset-2 hover:text-white">How payments work</Link>
        </div>
      </div>
    </footer>
  );
}
