import { randomBytes } from "node:crypto";
import { route, json } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { setSession } from "@/lib/server/session";
import { KINDS, SPORTS, STATES, type SeekerProfile, type SponsorProfile } from "@/lib/types";

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = <T extends string>(v: unknown, list: readonly T[], d: T) => (list.includes(v as T) ? (v as T) : d);

export const POST = route(async ({ sql, body }) => {
  const email = s(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "sponsor" ? "sponsor" : body.role === "seeker" ? "seeker" : null;
  const name = s(body.name, 80);
  const city = s(body.city, 40);
  if (!role) return json({ error: "Choose whether you need sponsors or are a sponsor." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 8) return json({ error: "Use a password of at least 8 characters." }, 400);
  if (!name) return json({ error: role === "seeker" ? "Enter your team, athlete or event name." : "Enter your brand name." }, 400);
  if (!city) return json({ error: "Enter your city." }, 400);

  const [exists] = await sql`select 1 from users where email = ${email}`;
  if (exists) return json({ error: "An account with this email already exists — log in instead." }, 409);

  const id = (role === "seeker" ? "sk_" : "sp_") + randomBytes(6).toString("hex");
  const state = pick(body.state, STATES, "Delhi");
  const profile: SeekerProfile | SponsorProfile =
    role === "seeker"
      ? { id, name, kind: pick(body.kind, KINDS, "team"), sport: pick(body.sport, SPORTS, "Other"), city, state }
      : { id, brand: name, industry: s(body.industry, 60) || "Other", city, state };
  await sql`insert into users (id, email, pass, role, profile) values (${id}, ${email}, ${await hashPassword(password)}, ${role}, ${sql.json(profile as never)})`;
  await setSession(id);
  return json({ ok: true, role });
});
