"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginNeeded, useMounted } from "@/components/ui";
import { actions, auth, useDB } from "@/lib/store";
import { KIND_LABEL, KINDS, SPORTS, STATES, type Kind } from "@/lib/types";

export default function ProfilePage() {
  const db = useDB();
  const router = useRouter();
  const mounted = useMounted();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!db.user) return <LoginNeeded what="Your profile" />;
  const s = db.me.seeker;
  const p = db.me.sponsor;
  const seeker = db.role === "seeker";

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
    setBusy(true);
    setMsg(null);
    try {
      await actions.updateProfile(seeker ? { ...patch, kind: patch.kind as Kind } : patch);
      setMsg({ ok: true, text: "Saved" });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">{seeker ? "Team / athlete account" : "Brand account"}</p>
      <h1 className="display mt-2 text-4xl uppercase">Your profile</h1>
      <p className="mt-3 text-ink-soft">Signed in as <strong className="text-ink">{db.user.email}</strong>{db.user.demo && " (shared demo account)"}.</p>

      <form className="card mt-8 flex flex-col gap-4 p-6" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          {seeker ? (
            <>
              <div><label className="field-label" htmlFor="sn">Team, athlete or event name</label><input id="sn" name="name" className="field" defaultValue={s.name} maxLength={80} required /></div>
              <div><label className="field-label" htmlFor="sk">Type</label><select id="sk" name="kind" className="field" defaultValue={s.kind}>{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></div>
              <div><label className="field-label" htmlFor="ss">Sport</label><select id="ss" name="sport" className="field" defaultValue={s.sport}>{SPORTS.map((x) => <option key={x}>{x}</option>)}</select></div>
            </>
          ) : (
            <>
              <div><label className="field-label" htmlFor="pb">Brand</label><input id="pb" name="brand" className="field" defaultValue={p.brand} maxLength={80} required /></div>
              <div><label className="field-label" htmlFor="pi">Industry</label><input id="pi" name="industry" className="field" defaultValue={p.industry} maxLength={60} /></div>
            </>
          )}
          <div><label className="field-label" htmlFor="pc">City</label><input id="pc" name="city" className="field" defaultValue={seeker ? s.city : p.city} maxLength={40} /></div>
          <div><label className="field-label" htmlFor="ps">State</label><select id="ps" name="state" className="field" defaultValue={seeker ? s.state : p.state}>{STATES.filter((x) => x !== "Pan-India").map((x) => <option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
          {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
        </div>
      </form>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="display-tight text-xl">Log out</h2>
          <p className="text-sm text-ink-soft">Switch to another account, e.g. the other demo login.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={async () => { await auth.logout(); router.push("/login/"); }}>Log out</button>
      </div>
    </div>
  );
}
