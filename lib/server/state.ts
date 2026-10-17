import "server-only";
import type { Brief, DB, Deal, Listing, SeekerProfile, SponsorProfile } from "../types";
import { UNPAID } from "../types";
import type { Sql } from "./db";
import type { Me } from "./session";
import { razorpayConfigured } from "./payments";

export const BLANK_SEEKER: SeekerProfile = { id: "", name: "", kind: "team", city: "", state: "Haryana", sport: "Kabaddi" };
export const BLANK_SPONSOR: SponsorProfile = { id: "", brand: "", industry: "", city: "", state: "Haryana" };

/** Everything this visitor may see: the public marketplace + their own deals and shortlist. */
export async function buildState(sql: Sql, me: Me | null): Promise<DB> {
  const [users, listings, briefs, committed, mine, saved] = await Promise.all([
    sql`select id, role, profile from users`,
    sql`select data from listings order by created_at desc`,
    sql`select data from briefs order by created_at desc`,
    sql`select d.listing_id, d.amount, u.profile->>'brand' as brand from deals d join users u on u.id = d.sponsor_id where d.status in ('accepted','completed')`,
    me ? sql`select data from deals where sponsor_id = ${me.id} or seeker_id = ${me.id} order by updated_at desc` : Promise.resolve([]),
    me ? sql`select listing_id from saved where user_id = ${me.id}` : Promise.resolve([]),
  ]);

  const raised: Record<string, number> = {};
  const backers: Record<string, string[]> = {};
  for (const r of committed) {
    raised[r.listing_id] = (raised[r.listing_id] ?? 0) + Number(r.amount);
    const list = (backers[r.listing_id] ??= []);
    if (!list.includes(r.brand)) list.push(r.brand);
  }

  return {
    version: 1,
    user: me ? { id: me.id, email: me.email, role: me.role, demo: me.demo } : null,
    role: me?.role ?? null,
    me: {
      seeker: me?.role === "seeker" ? (me.profile as SeekerProfile) : BLANK_SEEKER,
      sponsor: me?.role === "sponsor" ? (me.profile as SponsorProfile) : BLANK_SPONSOR,
    },
    seekers: users.filter((u) => u.role === "seeker").map((u) => u.profile as SeekerProfile),
    sponsors: users.filter((u) => u.role === "sponsor").map((u) => u.profile as SponsorProfile),
    listings: listings.map((r) => r.data as Listing),
    briefs: briefs.map((r) => r.data as Brief),
    deals: mine.map((r) => ({ ...(r.data as Deal), payment: (r.data as Deal).payment ?? UNPAID })),
    saved: saved.map((r) => r.listing_id as string),
    raised,
    backers,
    paymentsEnabled: razorpayConfigured(),
  };
}
