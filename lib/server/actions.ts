import "server-only";
import { uid } from "../format";
import {
  FORMATS, KINDS, LEVELS, OBJECTIVES, SPORTS, STATES, UNPAID,
  type Brief, type Deal, type DealStatus, type Listing, type SeekerProfile, type SponsorProfile,
} from "../types";
import type { Sql } from "./db";
import { razorpayConfigured, split } from "./payments";
import type { Me } from "./session";

/* Every write goes through here. The browser sends intent ({type, ...}); the server checks who
   is asking, validates the input and decides the outcome — the client is never trusted. */

export class ActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Obj = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, max = 100_000_000) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};
const oneOf = <T extends string>(v: unknown, list: readonly T[], dflt: T): T => (list.includes(v as T) ? (v as T) : dflt);
const someOf = <T extends string>(v: unknown, list: readonly T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => list.includes(x as T)))] : []);
const now = () => new Date().toISOString();

function cleanListing(i: Obj) {
  const a = (i.audience ?? {}) as Obj;
  const packages = (Array.isArray(i.packages) ? i.packages : []).slice(0, 4).map((p: Obj) => ({
    id: str(p.id, 24) || uid("p"),
    name: str(p.name, 40),
    price: int(p.price),
    deliverables: (Array.isArray(p.deliverables) ? p.deliverables : []).map((d) => str(d, 120)).filter(Boolean).slice(0, 12),
  }));
  const l = {
    kind: oneOf(i.kind, KINDS, "team"),
    title: str(i.title, 80),
    sport: oneOf(i.sport, SPORTS, "Other"),
    level: oneOf(i.level, LEVELS, "grassroots"),
    city: str(i.city, 40),
    state: oneOf(i.state, STATES, "Haryana"),
    dates: str(i.dates, 60),
    headline: str(i.headline, 140),
    story: str(i.story, 2000),
    audience: { attendance: int(a.attendance), instagram: int(a.instagram), youtube: int(a.youtube), whatsapp: int(a.whatsapp), demographic: str(a.demographic, 200) },
    formats: someOf(i.formats, FORMATS),
    packages,
    goal: int(i.goal),
    acceptsInKind: Boolean(i.acceptsInKind),
    contactName: str(i.contactName, 60),
    pastSponsors: str(i.pastSponsors, 160),
  };
  const errs: string[] = [];
  if (!l.title) errs.push("name");
  if (!l.headline) errs.push("headline");
  if (l.story.length < 40) errs.push("story (40+ characters)");
  if (!l.city) errs.push("city");
  if (!l.contactName) errs.push("contact name");
  if (!packages.length || packages.some((p) => !p.name || p.price < 500 || !p.deliverables.length)) errs.push("packages (name, price ≥ ₹500, a deliverable)");
  if (l.goal < 500) errs.push("funding goal");
  if (errs.length) throw new ActionError(`Please fix: ${errs.join(", ")}.`);
  return l;
}

function cleanBrief(i: Obj) {
  const b = {
    about: str(i.about, 600),
    sports: someOf(i.sports, SPORTS),
    states: someOf(i.states, STATES),
    levels: someOf(i.levels, LEVELS),
    budgetMin: int(i.budgetMin),
    budgetMax: int(i.budgetMax),
    objectives: someOf(i.objectives, OBJECTIVES),
    formats: someOf(i.formats, FORMATS),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(i.deadline)) ? String(i.deadline) : new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  };
  if (b.about.length < 20) throw new ActionError("Describe what you're looking for (20+ characters).");
  if (b.budgetMax < 500 || b.budgetMin > b.budgetMax) throw new ActionError("Set a budget range where the minimum is below the maximum.");
  return b;
}

function need(me: Me | null, role?: "seeker" | "sponsor"): Me {
  if (!me) throw new ActionError("Please log in first.", 401);
  if (role && me.role !== role) throw new ActionError(role === "seeker" ? "Only team/athlete accounts can do this." : "Only brand accounts can do this.", 403);
  return me;
}

/** Locks the deal row, checks the caller is a party, applies fn and saves. */
async function withDeal(sql: Sql, me: Me, dealId: unknown, fn: (d: Deal, tx: Sql) => Deal | Promise<Deal>) {
  await sql.begin(async (tx) => {
    const [row] = await tx`select data from deals where id = ${str(dealId, 40)} for update`;
    if (!row) throw new ActionError("Deal not found.", 404);
    const raw = row.data as Deal;
    const deal: Deal = { ...raw, payment: raw.payment ?? UNPAID };
    if (deal.sponsorId !== me.id && deal.seekerId !== me.id) throw new ActionError("This deal isn't yours.", 403);
    const next = await fn(deal, tx as unknown as Sql);
    next.updatedAt = now();
    await tx`update deals set data = ${tx.json(next as never)}, status = ${next.status}, amount = ${next.amount}, updated_at = ${next.updatedAt} where id = ${deal.id}`;
  });
}

const isOpen = (d: Deal) => d.status === "proposed" || d.status === "negotiating";
const sysMsg = (from: "sponsor" | "seeker", text: string) => ({ id: uid("m"), from, text: `✓ ${text}`, at: now() });

export async function runAction(sql: Sql, me: Me | null, input: Obj): Promise<{ id?: string }> {
  switch (input.type) {
    case "updateProfile": {
      const u = need(me);
      const p = (input.patch ?? {}) as Obj;
      const prof =
        u.role === "seeker"
          ? ({ ...(u.profile as SeekerProfile), name: str(p.name, 80) || (u.profile as SeekerProfile).name, kind: oneOf(p.kind, KINDS, (u.profile as SeekerProfile).kind), sport: oneOf(p.sport, SPORTS, "Other"), city: str(p.city, 40) || u.profile.city, state: oneOf(p.state, STATES, u.profile.state as never) } satisfies SeekerProfile)
          : ({ ...(u.profile as SponsorProfile), brand: str(p.brand, 80) || (u.profile as SponsorProfile).brand, industry: str(p.industry, 60) || (u.profile as SponsorProfile).industry, city: str(p.city, 40) || u.profile.city, state: oneOf(p.state, STATES, u.profile.state as never) } satisfies SponsorProfile);
      await sql`update users set profile = ${sql.json(prof as never)} where id = ${u.id}`;
      if (u.role === "sponsor") {
        const s = prof as SponsorProfile;
        await sql`update briefs set data = data || ${sql.json({ brand: s.brand, industry: s.industry })} where owner_id = ${u.id}`;
      }
      return {};
    }

    case "saveListing": {
      const u = need(me, "seeker");
      const l = cleanListing((input.listing ?? {}) as Obj);
      const id = str((input.listing as Obj)?.id, 40);
      if (id) {
        const [row] = await sql`select data, owner_id from listings where id = ${id}`;
        if (row) {
          if (row.owner_id !== u.id) throw new ActionError("This listing isn't yours.", 403);
          const next: Listing = { ...(row.data as Listing), ...l, id, ownerId: u.id };
          await sql`update listings set data = ${sql.json(next as never)} where id = ${id}`;
          return { id };
        }
      }
      const nid = uid("ls_");
      const next: Listing = { ...l, id: nid, ownerId: u.id, createdAt: now() };
      await sql`insert into listings (id, owner_id, data) values (${nid}, ${u.id}, ${sql.json(next as never)})`;
      return { id: nid };
    }

    case "deleteListing": {
      const u = need(me, "seeker");
      const id = str(input.id, 40);
      const [own] = await sql`select 1 from listings where id = ${id} and owner_id = ${u.id}`;
      if (!own) throw new ActionError("Listing not found.", 404);
      const [held] = await sql`select 1 from deals where listing_id = ${id} and data->'payment'->>'status' = 'held'`;
      if (held) throw new ActionError("This listing has money held in escrow. Complete that deal first.");
      const r = await sql`delete from listings where id = ${id} and owner_id = ${u.id}`;
      if (!r.count) throw new ActionError("Listing not found.", 404);
      return {};
    }

    case "saveBrief": {
      const u = need(me, "sponsor");
      const prof = u.profile as SponsorProfile;
      const b = { ...cleanBrief((input.brief ?? {}) as Obj), brand: prof.brand, industry: prof.industry };
      const id = str((input.brief as Obj)?.id, 40);
      if (id) {
        const [row] = await sql`select data, owner_id from briefs where id = ${id}`;
        if (row) {
          if (row.owner_id !== u.id) throw new ActionError("This brief isn't yours.", 403);
          await sql`update briefs set data = ${sql.json({ ...(row.data as Brief), ...b, id, ownerId: u.id } as never)} where id = ${id}`;
          return { id };
        }
      }
      const nid = uid("br_");
      const next: Brief = { ...b, id: nid, ownerId: u.id, createdAt: now() };
      await sql`insert into briefs (id, owner_id, data) values (${nid}, ${u.id}, ${sql.json(next as never)})`;
      return { id: nid };
    }

    case "deleteBrief": {
      const u = need(me, "sponsor");
      const r = await sql`delete from briefs where id = ${str(input.id, 40)} and owner_id = ${u.id}`;
      if (!r.count) throw new ActionError("Brief not found.", 404);
      return {};
    }

    case "toggleSave": {
      const u = need(me, "sponsor");
      const id = str(input.listingId, 40);
      const r = await sql`delete from saved where user_id = ${u.id} and listing_id = ${id}`;
      if (!r.count) {
        const [l] = await sql`select 1 from listings where id = ${id}`;
        if (!l) throw new ActionError("Listing not found.", 404);
        await sql`insert into saved values (${u.id}, ${id}) on conflict do nothing`;
      }
      return {};
    }

    case "createDeal": {
      const u = need(me);
      const [lrow] = await sql`select data from listings where id = ${str(input.listingId, 40)}`;
      if (!lrow) throw new ActionError("Listing not found.", 404);
      const listing = lrow.data as Listing;
      const briefId = str(input.briefId, 40) || null;
      const [brow] = briefId ? await sql`select data from briefs where id = ${briefId}` : [];
      const brief = (brow?.data as Brief | undefined) ?? null;
      if (briefId && !brief) throw new ActionError("Brief not found.", 404);
      let sponsorId: string, seekerId: string;
      if (u.role === "sponsor") {
        if (brief && brief.ownerId !== u.id) throw new ActionError("Pick one of your own briefs.", 403);
        sponsorId = u.id;
        seekerId = listing.ownerId;
      } else {
        if (listing.ownerId !== u.id) throw new ActionError("Pitch with one of your own listings.", 403);
        if (!brief) throw new ActionError("Choose the brand brief you're pitching.");
        sponsorId = brief.ownerId;
        seekerId = u.id;
      }
      const pkg = listing.packages.find((p) => p.id === input.packageId) ?? null;
      const amount = int(input.amount);
      const inKind = str(input.inKind, 120);
      if (amount < 500 && !inKind) throw new ActionError("Offer at least ₹500, or describe in-kind support.");
      const [open] = await sql`select id from deals where listing_id = ${listing.id} and sponsor_id = ${sponsorId} and status in ('proposed','negotiating','accepted')`;
      if (open) throw new ActionError("There's already an open deal between you for this listing — continue it in Deals.", 409);
      const t = now();
      const text = str(input.message, 1000);
      const deal: Deal = {
        id: uid("dl_"), listingId: listing.id, briefId: brief?.id ?? null, sponsorId, seekerId, initiatedBy: u.role,
        packageId: pkg?.id ?? null, amount, inKind, status: "proposed",
        messages: text ? [{ id: uid("m"), from: u.role, text, at: t }] : [],
        deliverables: [], payment: UNPAID, createdAt: t, updatedAt: t,
      };
      await sql`insert into deals (id, listing_id, sponsor_id, seeker_id, status, amount, data) values (${deal.id}, ${listing.id}, ${sponsorId}, ${seekerId}, 'proposed', ${amount}, ${sql.json(deal as never)})`;
      return { id: deal.id };
    }

    case "sendMessage": {
      const u = need(me);
      const text = str(input.text, 1000);
      if (!text) throw new ActionError("Write a message first.");
      await withDeal(sql, u, input.dealId, (d) => {
        if (d.status === "declined") throw new ActionError("This deal is closed.");
        return { ...d, status: d.status === "proposed" ? "negotiating" : d.status, messages: [...d.messages, { id: uid("m"), from: u.role, text, at: now() }] };
      });
      return {};
    }

    case "counter": {
      const u = need(me);
      const amount = int(input.amount);
      if (amount < 500) throw new ActionError("Enter an amount of at least ₹500.");
      const note = str(input.note, 200);
      await withDeal(sql, u, input.dealId, (d) => {
        if (!isOpen(d)) throw new ActionError("You can only counter an open offer.");
        return {
          ...d, amount, status: "negotiating",
          messages: [...d.messages, { id: uid("m"), from: u.role, text: `Counter-offer: ₹${amount.toLocaleString("en-IN")}${note ? ` — ${note}` : ""}`, at: now() }],
        };
      });
      return {};
    }

    case "setStatus": {
      const u = need(me);
      const status = input.status as DealStatus;
      await withDeal(sql, u, input.dealId, async (d, tx) => {
        const who = u.role === "sponsor" ? "Sponsor" : "Seeker";
        if (status === "accepted") {
          if (!isOpen(d)) throw new ActionError("This offer is no longer open.");
          if (d.status === "proposed" && d.initiatedBy === u.role) throw new ActionError("Wait for the other side to respond to your offer.");
          const [lrow] = await tx`select data from listings where id = ${d.listingId}`;
          const pkg = (lrow?.data as Listing | undefined)?.packages.find((p) => p.id === d.packageId);
          const deliverables = d.deliverables.length ? d.deliverables : (pkg?.deliverables ?? ["Agreed sponsorship deliverables"]).map((text) => ({ id: uid("d"), text, done: false, proof: "" }));
          const pay = d.amount > 0 && razorpayConfigured() ? " Next: sponsor pays the amount into escrow." : "";
          return { ...d, status, deliverables, messages: [...d.messages, sysMsg(u.role, `${who} accepted the deal.${pay}`)] };
        }
        if (status === "declined") {
          if (!isOpen(d)) throw new ActionError("Only open offers can be declined.");
          const withdraw = d.status === "proposed" && d.initiatedBy === u.role;
          return { ...d, status, messages: [...d.messages, sysMsg(u.role, `${who} ${withdraw ? "withdrew the offer" : "declined the deal"}.`)] };
        }
        if (status === "completed") {
          if (u.role !== "sponsor") throw new ActionError("The sponsor signs off the deal.", 403);
          if (d.status !== "accepted") throw new ActionError("Only accepted deals can be completed.");
          if (d.deliverables.some((x) => !x.done)) throw new ActionError("Every deliverable must be ticked off first.");
          const msgs = [...d.messages];
          let payment = d.payment;
          if (d.amount > 0 && razorpayConfigured() && payment.status !== "held") throw new ActionError("Pay the deal amount into escrow before completing.");
          if (payment.status === "held") {
            const { fee, payout } = split(d.amount);
            payment = { ...payment, status: "released", releasedAt: now(), fee, payout };
            msgs.push(sysMsg("sponsor", `Escrow released: ₹${payout.toLocaleString("en-IN")} paid out to the seeker (₹${fee.toLocaleString("en-IN")} platform fee).`));
          }
          msgs.push(sysMsg(u.role, "Sponsor marked the deal complete."));
          return { ...d, status, payment, messages: msgs };
        }
        throw new ActionError("Unknown status.");
      });
      return {};
    }

    case "toggleDeliverable":
    case "setProof": {
      const u = need(me, "seeker");
      await withDeal(sql, u, input.dealId, (d) => {
        if (d.status !== "accepted") throw new ActionError("Deliverables can be updated only on an accepted deal.");
        const delId = str(input.delId, 24);
        if (!d.deliverables.some((x) => x.id === delId)) throw new ActionError("Deliverable not found.", 404);
        return {
          ...d,
          deliverables: d.deliverables.map((x) => (x.id !== delId ? x : input.type === "setProof" ? { ...x, proof: str(input.proof, 200) } : { ...x, done: !x.done })),
        };
      });
      return {};
    }

    case "addDeliverable": {
      const u = need(me);
      const text = str(input.text, 120);
      if (!text) throw new ActionError("Describe the deliverable.");
      await withDeal(sql, u, input.dealId, (d) => {
        if (d.status !== "accepted") throw new ActionError("Deliverables can be added only on an accepted deal.");
        if (d.deliverables.length >= 30) throw new ActionError("That's a lot of deliverables — 30 max.");
        return { ...d, deliverables: [...d.deliverables, { id: uid("d"), text, done: false, proof: "" }] };
      });
      return {};
    }

    default:
      throw new ActionError("Unknown action.");
  }
}
