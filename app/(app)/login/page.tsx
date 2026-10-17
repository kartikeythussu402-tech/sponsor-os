"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Building2, Trophy } from "lucide-react";
import { auth } from "@/lib/store";

/** Only allow same-site relative redirects. */
function safeNext(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard/";
}

function Login() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const go = async (key: string, fn: () => Promise<void>) => {
    setErr(null);
    setBusy(key);
    try {
      await fn();
      router.push(next);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="container-page grid max-w-5xl gap-8 py-10 sm:py-14 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-turf-3">Welcome back</p>
        <h1 className="display mt-2 text-4xl uppercase">Log in</h1>
        <form className="card mt-6 flex flex-col gap-4 p-6" onSubmit={(e) => { e.preventDefault(); go("form", () => auth.login(email, password)); }} noValidate>
          <div><label className="field-label" htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="field-label" htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {err && <p role="alert" className="field-error">{err}</p>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={!!busy}>{busy === "form" ? "Logging in…" : "Log in"}</button>
          <p className="text-sm text-ink-soft">New here? <Link href="/signup/" className="font-semibold text-turf-3 underline">Create a free account</Link></p>
        </form>
      </div>
      <div className="rounded-3xl bg-turf p-6 text-white sm:p-8">
        <p className="eyebrow text-lime">Just looking?</p>
        <h2 className="display-tight mt-2 text-2xl">Try a demo account</h2>
        <p className="mt-2 text-white/80">Shared accounts with sample deals already in progress. Log in as one side, make a move, then log out and reply as the other.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="btn btn-lime btn-lg justify-start" disabled={!!busy} onClick={() => go("seeker", () => auth.demo("seeker"))}>
            <Trophy size={18} aria-hidden="true" /> {busy === "seeker" ? "Signing in…" : "Demo team · Rohtak Rangers Kabaddi"}
          </button>
          <button type="button" className="btn btn-lg justify-start border border-white/30 text-white hover:bg-white/10" disabled={!!busy} onClick={() => go("sponsor", () => auth.demo("sponsor"))}>
            <Building2 size={18} aria-hidden="true" /> {busy === "sponsor" ? "Signing in…" : "Demo brand · Kesar Fizz Energy Drink"}
          </button>
        </div>
        <p className="mt-4 text-xs text-white/60">Demo logins: team@demo.sponsoros.in / brand@demo.sponsoros.in · password demo1234</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" />}>
      <Login />
    </Suspense>
  );
}
