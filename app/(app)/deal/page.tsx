"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, PartyPopper, Plus, Send } from "lucide-react";
import { StatusPill } from "@/components/deal-bits";
import { Empty, LoginNeeded, Modal, SportBadge, useMounted } from "@/components/ui";
import { PayEscrowButton } from "@/components/pay-button";
import { PayPill } from "@/components/deal-bits";
import { inr, niceDate, timeAgo } from "@/lib/format";
import { PLATFORM_FEE } from "@/lib/types";
import { actions, useDB } from "@/lib/store";

function DealRoom() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const isNew = params.get("new") === "1";
  const db = useDB();
  const mounted = useMounted();
  const [text, setText] = useState("");
  const [counter, setCounter] = useState(false);
  const [counterAmt, setCounterAmt] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [newDel, setNewDel] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const deal = db.deals.find((d) => d.id === id);
  const msgCount = deal?.messages.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgCount]);

  if (!mounted) return <div className="h-[60svh]" aria-hidden="true" />;
  if (!db.user) return <LoginNeeded what="Opening this deal" />;
  if (!deal) {
    return (
      <div className="container-page py-16">
        <Empty title="Deal not found" action={<Link href="/deals/" className="btn btn-primary">All deals</Link>} />
      </div>
    );
  }

  const role = db.role;
  const isParty = role === "seeker" ? deal.seekerId === db.me.seeker.id : deal.sponsorId === db.me.sponsor.id;
  const listing = db.listings.find((l) => l.id === deal.listingId);
  const sponsor = db.sponsors.find((s) => s.id === deal.sponsorId);
  const seeker = db.seekers.find((s) => s.id === deal.seekerId);
  const pkg = listing?.packages.find((p) => p.id === deal.packageId);
  const open = deal.status === "proposed" || deal.status === "negotiating";
  const canRespond = isParty && open && !(deal.status === "proposed" && deal.initiatedBy === role);
  const doneCount = deal.deliverables.filter((x) => x.done).length;
  const needsPayment = db.paymentsEnabled && deal.amount > 0 && deal.payment.status === "unpaid";
  const fee = Math.round(deal.amount * PLATFORM_FEE);
  const split = { fee, payout: deal.amount - fee };

  if (!isParty) return <LoginNeeded what="Opening this deal" />;

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const r = role!;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text;
    setText("");
    if (!(await run(() => actions.sendMessage(deal.id, t)))) setText(t);
  };

  const submitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(counterAmt.replace(/[^\d]/g, ""));
    if (!n || n < 500) return setErr("Enter an amount of at least ₹500.");
    if (await run(() => actions.counter(deal.id, n, counterNote))) {
      setCounter(false);
      setCounterNote("");
    }
  };

  const otherName = role === "seeker" ? sponsor?.brand : seeker?.name;

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/deals/" className="text-sm font-semibold text-ink-mute hover:text-ink">← All deals</Link>

      {isNew && (
        <div role="status" className="animate-rise mt-4 rounded-2xl bg-lime px-5 py-4 font-semibold text-ink">
          {deal.initiatedBy === "sponsor" ? "Offer sent" : "Pitch sent"} to {otherName}. You can keep chatting here — they&apos;ll reply in this thread.
          {db.user?.demo && <span className="mt-1 block text-sm font-normal text-ink-soft">Demo tip: log out and use the {role === "seeker" ? "brand" : "team"} demo login to reply as the other side.</span>}
        </div>
      )}

      <header className="card mt-4 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <SportBadge sport={listing?.sport ?? "Other"} size={52} />
          <div>
            <p className="eyebrow text-ink-mute">{sponsor?.brand} × {seeker?.name}</p>
            <h1 className="display-tight mt-1 text-2xl leading-tight">{pkg ? pkg.name : "Custom offer"} · {listing?.title}</h1>
            <p className="mt-1 text-sm text-ink-mute">Started by {deal.initiatedBy === "sponsor" ? "sponsor" : "seeker"} · updated {timeAgo(deal.updatedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
          <p className="stat-num text-3xl">{inr(deal.amount)}</p>
          <StatusPill status={deal.status} />
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Thread */}
        <section className="card flex min-h-[420px] flex-col" aria-label="Messages">
          <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
            {deal.messages.length === 0 && <li className="text-center text-sm text-ink-mute">No messages yet.</li>}
            {deal.messages.map((m) => {
              const mine = m.from === role;
              const system = m.text.startsWith("✓ ");
              if (system) {
                return (
                  <li key={m.id} className="self-center rounded-full bg-chalk-2 px-3 py-1 text-xs font-semibold text-ink-soft">
                    {m.text.slice(2)} · {timeAgo(m.at)}
                  </li>
                );
              }
              return (
                <li key={m.id} className={`flex max-w-[85%] flex-col gap-1 ${mine ? "self-end items-end" : "self-start"}`}>
                  <span className="text-[11px] font-semibold text-ink-mute">{m.from === "sponsor" ? sponsor?.brand : seeker?.name} · {timeAgo(m.at)}</span>
                  <p className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${mine ? "rounded-br-md bg-turf text-white" : "rounded-bl-md bg-chalk-2 text-ink"} ${m.text.startsWith("Counter-offer") ? "ring-2 ring-lime" : ""}`}>
                    {m.text}
                  </p>
                </li>
              );
            })}
            <div ref={endRef} />
          </ol>
          {deal.status !== "declined" && deal.status !== "completed" && (
            <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
              <label htmlFor="msg" className="sr-only">Message</label>
              <input id="msg" className="field" placeholder={`Message ${otherName ?? ""}…`} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
              <button type="submit" className="btn btn-primary w-12 shrink-0 px-0" aria-label="Send message" disabled={!text.trim()}>
                <Send size={18} aria-hidden="true" />
              </button>
            </form>
          )}
        </section>

        {/* Actions + deliverables */}
        <aside className="flex flex-col gap-5">
          {err && !counter && <p role="alert" className="rounded-xl bg-clay-soft px-4 py-3 text-sm font-semibold text-clay">{err}</p>}
          {open && (
            <section className="card flex flex-col gap-3 p-5">
              <h2 className="eyebrow text-ink-mute">{canRespond ? "Respond" : "Waiting on " + otherName}</h2>
              {canRespond ? (
                <>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => actions.setStatus(deal.id, "accepted"))}>Accept {inr(deal.amount)}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setCounterAmt(String(deal.amount)); setCounter(true); }}>Counter-offer</button>
                  <button type="button" className="btn btn-ghost text-danger" disabled={busy} onClick={() => confirm("Decline this deal?") && run(() => actions.setStatus(deal.id, "declined"))}>Decline</button>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-soft">They&apos;ll accept, counter or decline. You can keep messaging meanwhile.</p>
                  <button type="button" className="btn btn-ghost text-danger" disabled={busy} onClick={() => confirm("Withdraw this offer?") && run(() => actions.setStatus(deal.id, "declined"))}>Withdraw</button>
                </>
              )}
            </section>
          )}

          {(deal.status === "accepted" || deal.status === "completed") && deal.amount > 0 && (
            <section className="card flex flex-col gap-3 p-5" aria-label="Payment">
              <div className="flex items-center justify-between gap-3">
                <h2 className="eyebrow text-ink-mute">Escrow payment</h2>
                <PayPill status={deal.payment.status} />
              </div>
              {deal.payment.status === "unpaid" && (
                !db.paymentsEnabled ? (
                  <p className="text-sm text-ink-soft">Payments aren&apos;t switched on for this deployment, so this deal is tracked without escrow.</p>
                ) : r === "sponsor" ? (
                  <>
                    <p className="text-sm text-ink-soft">Pay now and the money is held safely by Sponsor OS. It&apos;s released to {seeker?.name} only after you approve every deliverable.</p>
                    <PayEscrowButton deal={deal} title={`${pkg?.name ?? "Custom"} · ${listing?.title ?? ""}`} />
                  </>
                ) : (
                  <p className="text-sm text-ink-soft">Waiting for {sponsor?.brand} to pay {inr(deal.amount)} into escrow. You can start on deliverables meanwhile.</p>
                )
              )}
              {deal.payment.status !== "unpaid" && (
                <dl className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-ink-mute">Paid by sponsor</dt><dd className="font-semibold">{inr(deal.amount)}</dd></div>
                  {deal.payment.paidAt && <div className="flex justify-between gap-3"><dt className="text-ink-mute">Paid on</dt><dd>{niceDate(deal.payment.paidAt)}</dd></div>}
                  {deal.payment.paymentId && <div className="flex justify-between gap-3"><dt className="text-ink-mute">Payment ID</dt><dd className="truncate font-mono text-xs">{deal.payment.paymentId}</dd></div>}
                  <div className="flex justify-between gap-3"><dt className="text-ink-mute">Platform fee (5%)</dt><dd>{inr(deal.payment.status === "released" ? deal.payment.fee : split.fee)}</dd></div>
                  <div className="flex justify-between gap-3 border-t border-line pt-1.5"><dt className="font-semibold">{deal.payment.status === "released" ? "Paid out to seeker" : "Seeker receives on approval"}</dt><dd className="stat-num">{inr(deal.payment.status === "released" ? deal.payment.payout : split.payout)}</dd></div>
                </dl>
              )}
            </section>
          )}

          {(deal.status === "accepted" || deal.status === "completed") && (
            <section className="card flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="eyebrow text-ink-mute">Deliverables</h2>
                <span className="text-sm font-semibold">{doneCount}/{deal.deliverables.length} done</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-chalk-2" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={deal.deliverables.length} aria-label="Deliverables completed">
                <div className="h-full bg-turf-3" style={{ width: `${deal.deliverables.length ? (doneCount / deal.deliverables.length) * 100 : 0}%` }} />
              </div>
              <ul className="flex flex-col gap-3">
                {deal.deliverables.map((x) => (
                  <li key={x.id} className="rounded-xl border border-line bg-white p-3">
                    <button
                      type="button"
                      className="flex w-full items-start gap-2.5 text-left disabled:cursor-default"
                      onClick={() => run(() => actions.toggleDeliverable(deal.id, x.id))}
                      disabled={role !== "seeker" || deal.status === "completed"}
                      aria-pressed={x.done}
                    >
                      {x.done ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-turf-3" aria-hidden="true" /> : <Circle size={20} className="mt-0.5 shrink-0 text-ink-mute" aria-hidden="true" />}
                      <span className={`font-medium ${x.done ? "text-ink-mute line-through" : ""}`}>{x.text}</span>
                    </button>
                    {role === "seeker" && deal.status !== "completed" ? (
                      <input
                        className="field mt-2 min-h-9 text-sm"
                        placeholder="Proof — link to post, photo note, date…"
                        aria-label={`Proof for ${x.text}`}
                        defaultValue={x.proof}
                        maxLength={200}
                        onBlur={(e) => e.target.value !== x.proof && run(() => actions.setProof(deal.id, x.id, e.target.value))}
                      />
                    ) : (
                      x.proof && <p className="mt-1.5 pl-7 text-sm text-ink-soft">Proof: {x.proof}</p>
                    )}
                  </li>
                ))}
              </ul>
              {deal.status === "accepted" && (
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run(() => actions.addDeliverable(deal.id, newDel))) setNewDel("");
                  }}
                >
                  <label htmlFor="nd" className="sr-only">Add deliverable</label>
                  <input id="nd" className="field min-h-10 text-sm" placeholder="Add a deliverable" value={newDel} onChange={(e) => setNewDel(e.target.value)} maxLength={120} />
                  <button type="submit" className="btn btn-secondary btn-sm shrink-0" disabled={!newDel.trim()}><Plus size={15} aria-hidden="true" /> Add</button>
                </form>
              )}
              {role === "seeker" && deal.status === "accepted" && <p className="text-xs text-ink-mute">Tick items off as you deliver them and add proof so the sponsor can verify.</p>}
              {role === "sponsor" && deal.status === "accepted" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || doneCount < deal.deliverables.length || needsPayment}
                  onClick={() => confirm(deal.payment.status === "held" ? `Release ${inr(split.payout)} to the seeker and close the deal?` : "Mark this deal complete?") && run(() => actions.setStatus(deal.id, "completed"))}
                >
                  {needsPayment
                    ? "Pay into escrow first"
                    : doneCount < deal.deliverables.length
                      ? `Waiting on ${deal.deliverables.length - doneCount} deliverable${deal.deliverables.length - doneCount > 1 ? "s" : ""}`
                      : deal.payment.status === "held"
                        ? "Approve & release payment"
                        : "Mark deal complete"}
                </button>
              )}
              {deal.status === "completed" && (
                <p className="flex items-center gap-2 rounded-xl bg-turf px-4 py-3 text-sm font-semibold text-white"><PartyPopper size={18} aria-hidden="true" /> Deal completed — every deliverable signed off.</p>
              )}
            </section>
          )}

          <section className="card flex flex-col gap-2 p-5 text-sm">
            <h2 className="eyebrow mb-1 text-ink-mute">Deal terms</h2>
            <p className="flex justify-between gap-3"><span className="text-ink-mute">Cash</span><strong>{inr(deal.amount)}</strong></p>
            {deal.inKind && <p className="flex justify-between gap-3"><span className="text-ink-mute">In-kind</span><strong className="text-right">{deal.inKind}</strong></p>}
            <p className="flex justify-between gap-3"><span className="text-ink-mute">Package</span><strong>{pkg?.name ?? "Custom"}</strong></p>
            {pkg && (
              <ul className="mt-1 list-disc pl-5 text-ink-soft">
                {pkg.deliverables.map((d) => <li key={d}>{d}</li>)}
              </ul>
            )}
            {listing && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/listing/?id=${listing.id}`} className="btn btn-secondary btn-sm">View listing</Link>
                <Link href={`/kit/?id=${listing.id}`} target="_blank" className="btn btn-ghost btn-sm">Sponsorship deck</Link>
              </div>
            )}
          </section>
        </aside>
      </div>

      {counter && (
        <Modal title="Counter-offer" onClose={() => setCounter(false)}>
          <form onSubmit={submitCounter} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="ca" className="field-label">New amount (₹)</label>
              <input id="ca" inputMode="numeric" className="field" value={counterAmt} onChange={(e) => setCounterAmt(e.target.value.replace(/[^\d]/g, ""))} autoFocus />
            </div>
            <div>
              <label htmlFor="cn" className="field-label">Note <span className="font-normal text-ink-mute">(optional)</span></label>
              <input id="cn" className="field" value={counterNote} onChange={(e) => setCounterNote(e.target.value)} maxLength={200} placeholder="e.g. includes the sampling stall" />
            </div>
            {err && <p role="alert" className="field-error">{err}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setCounter(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Send counter</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[60svh]" aria-hidden="true" />}>
      <DealRoom />
    </Suspense>
  );
}
