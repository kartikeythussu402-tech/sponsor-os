import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/server/db";
import { route, json } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { setSession } from "@/lib/server/session";

export const POST = route(async ({ sql, body }) => {
  // One-click demo logins for reviewers: {demo: "seeker" | "sponsor"}
  const demo = body.demo === "seeker" || body.demo === "sponsor" ? body.demo : null;
  const email = demo ? DEMO_ACCOUNTS[demo] : typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = demo ? DEMO_PASSWORD : typeof body.password === "string" ? body.password : "";
  if (!email || !password) return json({ error: "Enter your email and password." }, 400);
  const [u] = await sql`select id, pass, role from users where email = ${email}`;
  if (!u || !(await verifyPassword(password, u.pass))) return json({ error: "Wrong email or password." }, 401);
  await setSession(u.id);
  return json({ ok: true, role: u.role });
});
