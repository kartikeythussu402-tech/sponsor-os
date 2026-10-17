import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SeekerProfile, SessionUser, SponsorProfile } from "../types";
import { databaseUrl, type Sql } from "./db";

/* Stateless signed session cookie: <userId>.<expiry ms>.<HMAC>. HttpOnly, so page scripts can't read it. */

export const COOKIE = "sos_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret(): string {
  // AUTH_SECRET if set; otherwise derived from the (already secret) database URL so no extra setup is needed.
  return process.env.AUTH_SECRET || createHash("sha256").update(`sponsor-os|${databaseUrl() ?? "none"}`).digest("hex");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(userId: string, now = Date.now()): string {
  const payload = `${userId}.${now + MAX_AGE_S * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const want = Buffer.from(sign(payload));
  if (sig.length !== want.length || !timingSafeEqual(sig, want)) return null;
  const [userId, exp] = payload.split(".");
  if (!userId || !(Number(exp) > now)) return null;
  return userId;
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export interface Me extends SessionUser {
  profile: SeekerProfile | SponsorProfile;
}

export async function currentUser(sql: Sql): Promise<Me | null> {
  const id = readToken((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const [u] = await sql`select id, email, role, profile, demo from users where id = ${id}`;
  if (!u) return null;
  return { id: u.id, email: u.email, role: u.role, demo: u.demo, profile: u.profile };
}
