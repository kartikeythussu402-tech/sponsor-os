"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Building2, Trophy } from "lucide-react";
import { auth } from "@/lib/store";
import { KIND_LABEL, KINDS, SPORTS, STATES, type Role } from "@/lib/types";

function Signup() {
  const router = useRouter();
  const initial = useSearchParams().get("role");
  const [role, setRole] = useState<Role>(initial === "sponsor" ? "sponsor" : "seeker");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries([...new FormData(e.currentTarget).entries()].map(([k, v]) => [k, String(v)]));
    if (!f.email || !f.password || !f.name || !f.city) return setErr("Please fill in every field.");
    if (f.password.length < 8) return setErr("Use a password of at least 8 characters.");
    setErr(null);
    setBusy(true);
    try {
      await auth.signup({ ...f, role });
      router.push(role === "seeker" ? "/listing/edit/?new=1" : "/brief/edit/?new=1");
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Free to join</p>
      <h1 className="display mt-2 text-4xl uppercase">Create your account</h1>

      <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
        <legend className="field-label">I am…</legend>
        {([
          ["seeker", "Looking for sponsors", "Athlete, team, tournament, league or event", Trophy],
          ["sponsor", "A sponsor / brand", "Business, brand or CSR team", Building2],
        ] as const).map(([r, t, sub, Icon]) => (
          <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${role === r ? "border-turf bg-turf/5" : "border-line bg-white hover:border-ink-mute"}`}>
            <Icon size={22} className="mt-0.5 shrink-0 text-turf-3" aria-hidden="true" />
            <span><span className="block font-semibold">{t}</span><span className="text-sm text-ink-mute">{sub}</span></span>
          </button>
        ))}
      </fieldset>

      <form key={role} className="card mt-6 flex flex-col gap-4 p-6" onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="field-label" htmlFor="nm">{role === "seeker" ? "Team, athlete or event name" : "Brand name"}</label><input id="nm" name="name" className="field" maxLength={80} required /></div>
          {role === "seeker" ? (
            <>
              <div><label className="field-label" htmlFor="kd">Type</label><select id="kd" name="kind" className="field" defaultValue="team">{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></div>
              <div><label className="field-label" htmlFor="sp">Sport</label><select id="sp" name="sport" className="field" defaultValue="Cricket">{SPORTS.map((x) => <option key={x}>{x}</option>)}</select></div>
            </>
          ) : (
            <div className="sm:col-span-2"><label className="field-label" htmlFor="in">Industry</label><input id="in" name="industry" className="field" maxLength={60} placeholder="e.g. Beverages, Education, Cement" /></div>
          )}
          <div><label className="field-label" htmlFor="ct">City</label><input id="ct" name="city" className="field" maxLength={40} required /></div>
          <div><label className="field-label" htmlFor="st">State</label><select id="st" name="state" className="field" defaultValue="Delhi">{STATES.filter((x) => x !== "Pan-India").map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className="field-label" htmlFor="em">Email</label><input id="em" name="email" type="email" autoComplete="email" className="field" required /></div>
          <div><label className="field-label" htmlFor="pw">Password</label><input id="pw" name="password" type="password" autoComplete="new-password" minLength={8} className="field" required /></div>
        </div>
        {err && <p role="alert" className="field-error">{err}</p>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-sm text-ink-soft">Already have one? <Link href="/login/" className="font-semibold text-turf-3 underline">Log in</Link> · or try a <Link href="/login/" className="font-semibold text-turf-3 underline">demo account</Link></p>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" />}>
      <Signup />
    </Suspense>
  );
}
