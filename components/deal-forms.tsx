"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inr } from "@/lib/format";
import { actions, useDB } from "@/lib/store";
import type { Brief, Listing } from "@/lib/types";
import { Modal } from "./ui";

/** Sponsor sends an offer on a listing (optionally pre-selecting a package). */
export function OfferModal({ listing, packageId, onClose }: { listing: Listing; packageId?: string; onClose: () => void }) {
  const db = useDB();
  const router = useRouter();
  const myBriefs = db.briefs.filter((b) => b.ownerId === db.me.sponsor.id);
  const [pkg, setPkg] = useState<string>(packageId ?? listing.packages[0]?.id ?? "custom");
  const chosen = listing.packages.find((p) => p.id === pkg);
  const [amount, setAmount] = useState<string>(String(chosen?.price ?? ""));
  const [inKind, setInKind] = useState("");
  const [briefId, setBriefId] = useState<string>(myBriefs[0]?.id ?? "");
  const [message, setMessage] = useState(`Hi ${listing.contactName.split(" ")[0]} — ${db.me.sponsor.brand} would love to back ${listing.title}${chosen ? ` with the ${chosen.name} package` : ""}.`);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (id: string) => {
    setPkg(id);
    const p = listing.packages.find((x) => x.id === id);
    if (p) setAmount(String(p.price));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 500) return setError("Enter an amount of at least ₹500.");
    if (n > 10_000_000) return setError("That's above ₹1 crore — please contact the seeker directly.");
    if (!message.trim()) return setError("Add a short message.");
    setBusy(true);
    try {
      const id = await actions.createDeal({ listingId: listing.id, briefId: briefId || null, packageId: pkg === "custom" ? null : pkg, amount: n, inKind, message });
      router.push(`/deal/?id=${id}&new=1`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Offer to ${listing.title}`} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <fieldset>
          <legend className="field-label">Package</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[...listing.packages.map((p) => ({ id: p.id, name: p.name, sub: inr(p.price) })), { id: "custom", name: "Custom offer", sub: "Propose your own" }].map((o) => (
              <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${pkg === o.id ? "border-turf bg-turf/5" : "border-line bg-white"}`}>
                <span>
                  <span className="block font-semibold">{o.name}</span>
                  <span className="text-sm text-ink-mute">{o.sub}</span>
                </span>
                <input type="radio" name="pkg" className="h-5 w-5 accent-[#123d2a]" checked={pkg === o.id} onChange={() => pick(o.id)} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amt" className="field-label">Cash amount (₹)</label>
            <input id="amt" inputMode="numeric" className="field" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <div>
            <label htmlFor="ik" className="field-label">In-kind support <span className="font-normal text-ink-mute">(optional)</span></label>
            <input id="ik" className="field" placeholder="e.g. 500 drinks per match" value={inKind} onChange={(e) => setInKind(e.target.value)} maxLength={120} />
          </div>
        </div>
        {myBriefs.length > 1 && (
          <div>
            <label htmlFor="br" className="field-label">Under which brief?</label>
            <select id="br" className="field" value={briefId} onChange={(e) => setBriefId(e.target.value)}>
              {myBriefs.map((b) => <option key={b.id} value={b.id}>{b.about.slice(0, 60)}…</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="msg" className="field-label">Message</label>
          <textarea id="msg" className="field" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
        </div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send offer"}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Seeker pitches one of their listings to a sponsor's brief. */
export function PitchModal({ brief, onClose }: { brief: Brief; onClose: () => void }) {
  const db = useDB();
  const router = useRouter();
  const mine = db.listings.filter((l) => l.ownerId === db.me.seeker.id);
  const [listingId, setListingId] = useState(mine[0]?.id ?? "");
  const listing = mine.find((l) => l.id === listingId);
  const affordable = listing?.packages.filter((p) => p.price <= brief.budgetMax) ?? [];
  const [pkg, setPkg] = useState<string>(affordable[affordable.length - 1]?.id ?? listing?.packages[0]?.id ?? "custom");
  const chosen = listing?.packages.find((p) => p.id === pkg);
  const [amount, setAmount] = useState(String(chosen?.price ?? brief.budgetMin));
  const [message, setMessage] = useState(
    `Namaste ${brief.brand} team! ${listing?.title ?? "We"} would be a great fit for your brief — ${listing?.headline ?? ""}`.trim(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!mine.length) {
    return (
      <Modal title={`Pitch ${brief.brand}`} onClose={onClose}>
        <p className="text-ink-soft">Create your sponsorship listing first — the brand will see your story, reach and packages.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Not now</button>
          <button type="button" className="btn btn-primary" onClick={() => router.push("/listing/edit/")}>Create listing</button>
        </div>
      </Modal>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = Number(amount);
    if (!listing) return setError("Choose a listing.");
    if (!Number.isFinite(n) || n < 500) return setError("Enter an amount of at least ₹500.");
    if (!message.trim()) return setError("Add a short pitch message.");
    setBusy(true);
    try {
      const id = await actions.createDeal({ listingId: listing.id, briefId: brief.id, packageId: pkg === "custom" ? null : pkg, amount: n, inKind: "", message });
      router.push(`/deal/?id=${id}&new=1`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Pitch ${brief.brand}`} onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {mine.length > 1 && (
          <div>
            <label htmlFor="ls" className="field-label">Which listing?</label>
            <select id="ls" className="field" value={listingId} onChange={(e) => setListingId(e.target.value)}>
              {mine.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        )}
        <fieldset>
          <legend className="field-label">Package to propose · brand budget {inr(brief.budgetMin)}–{inr(brief.budgetMax)}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[...(listing?.packages ?? []).map((p) => ({ id: p.id, name: p.name, price: p.price })), { id: "custom", name: "Custom amount", price: 0 }].map((o) => (
              <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${pkg === o.id ? "border-turf bg-turf/5" : "border-line bg-white"}`}>
                <span>
                  <span className="block font-semibold">{o.name}</span>
                  <span className="text-sm text-ink-mute">
                    {o.price ? inr(o.price) : "Your number"}
                    {o.price > brief.budgetMax && <span className="ml-1 font-semibold text-clay">· over budget</span>}
                  </span>
                </span>
                <input
                  type="radio"
                  name="pkg"
                  className="h-5 w-5 accent-[#123d2a]"
                  checked={pkg === o.id}
                  onChange={() => {
                    setPkg(o.id);
                    if (o.price) setAmount(String(o.price));
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="amt2" className="field-label">Amount (₹)</label>
          <input id="amt2" inputMode="numeric" className="field" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div>
          <label htmlFor="msg2" className="field-label">Your pitch</label>
          <textarea id="msg2" className="field" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
          <p className="mt-1 text-xs text-ink-mute">Your listing, reach numbers and sponsorship deck are attached automatically.</p>
        </div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send pitch"}</button>
        </div>
      </form>
    </Modal>
  );
}
