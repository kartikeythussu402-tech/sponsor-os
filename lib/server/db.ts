import "server-only";
import postgres from "postgres";
import { randomBytes } from "node:crypto";
import { seedData } from "../seed";
import { hashPassword } from "./password";

/* One Postgres connection pool per server instance. Works with Neon (Vercel Storage),
   Supabase or any Postgres: set DATABASE_URL (Vercel's Neon integration sets it for you). */

export type Sql = postgres.Sql;

export function databaseUrl(): string | null {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

const g = globalThis as unknown as { __sosSql?: Sql; __sosReady?: Promise<void> };

export function getSql(): Sql | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!g.__sosSql) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    g.__sosSql = postgres(url, {
      max: local ? 5 : 3,
      prepare: false, // safe behind PgBouncer / Neon pooler
      ssl: local ? false : "require",
      idle_timeout: 20,
      onnotice: () => {},
    });
  }
  return g.__sosSql;
}

export const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS = { seeker: "team@demo.sponsoros.in", sponsor: "brand@demo.sponsoros.in" } as const;

const SCHEMA = `
create table if not exists users (
  id text primary key,
  email text unique not null,
  pass text not null,
  role text not null check (role in ('seeker','sponsor')),
  profile jsonb not null,
  demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists listings (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists briefs (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists deals (
  id text primary key,
  listing_id text not null references listings(id) on delete cascade,
  sponsor_id text not null references users(id) on delete cascade,
  seeker_id text not null references users(id) on delete cascade,
  status text not null,
  amount integer not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists deals_sponsor on deals(sponsor_id);
create index if not exists deals_seeker on deals(seeker_id);
create index if not exists deals_listing on deals(listing_id);
create table if not exists saved (
  user_id text not null references users(id) on delete cascade,
  listing_id text not null references listings(id) on delete cascade,
  primary key (user_id, listing_id)
);
create table if not exists payment_orders (
  order_id text primary key,
  deal_id text not null references deals(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  amount_paise integer not null,
  status text not null default 'created',
  payment_id text,
  created_at timestamptz not null default now()
);
create table if not exists meta (key text primary key, value text not null);
`;

/** Creates tables and loads the fictional sample data once. Safe to call on every request. */
export function ensureReady(sql: Sql): Promise<void> {
  if (!g.__sosReady) {
    g.__sosReady = (async () => {
      await sql.unsafe(SCHEMA);
      await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(424242)`;
        const [done] = await tx`select value from meta where key = 'seeded'`;
        if (done) return;
        const d = seedData();
        const demoHash = await hashPassword(DEMO_PASSWORD);
        for (const s of d.seekers) {
          const demo = s.id === "sk_me";
          const email = demo ? DEMO_ACCOUNTS.seeker : `${s.id}@sample.sponsoros.in`;
          const pass = demo ? demoHash : await hashPassword(randomBytes(18).toString("hex"));
          await tx`insert into users (id, email, pass, role, profile, demo) values (${s.id}, ${email}, ${pass}, 'seeker', ${tx.json(s as never)}, ${demo}) on conflict do nothing`;
        }
        for (const s of d.sponsors) {
          const demo = s.id === "sp_me";
          const email = demo ? DEMO_ACCOUNTS.sponsor : `${s.id}@sample.sponsoros.in`;
          const pass = demo ? demoHash : await hashPassword(randomBytes(18).toString("hex"));
          await tx`insert into users (id, email, pass, role, profile, demo) values (${s.id}, ${email}, ${pass}, 'sponsor', ${tx.json(s as never)}, ${demo}) on conflict do nothing`;
        }
        for (const l of d.listings) await tx`insert into listings (id, owner_id, data, created_at) values (${l.id}, ${l.ownerId}, ${tx.json(l as never)}, ${l.createdAt}) on conflict do nothing`;
        for (const b of d.briefs) await tx`insert into briefs (id, owner_id, data, created_at) values (${b.id}, ${b.ownerId}, ${tx.json(b as never)}, ${b.createdAt}) on conflict do nothing`;
        for (const x of d.deals)
          await tx`insert into deals (id, listing_id, sponsor_id, seeker_id, status, amount, data, updated_at) values (${x.id}, ${x.listingId}, ${x.sponsorId}, ${x.seekerId}, ${x.status}, ${x.amount}, ${tx.json(x as never)}, ${x.updatedAt}) on conflict do nothing`;
        for (const [uid, ids] of Object.entries(d.saved)) for (const id of ids) await tx`insert into saved values (${uid}, ${id}) on conflict do nothing`;
        await tx`insert into meta values ('seeded', ${new Date().toISOString()})`;
      });
    })().catch((e) => {
      g.__sosReady = undefined; // retry on next request
      throw e;
    });
  }
  return g.__sosReady;
}

/** Ready-to-use connection, or null when no database is configured. */
export async function db(): Promise<Sql | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureReady(sql);
  return sql;
}
