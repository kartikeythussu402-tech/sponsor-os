import "server-only";
import { NextResponse } from "next/server";
import { db, type Sql } from "./db";
import { currentUser, type Me } from "./session";
import { ActionError } from "./actions";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const NOT_SET_UP = { error: "The database isn't connected yet. In Vercel: Storage → Create Database → Neon, connect it to this project, then redeploy.", setup: true };

/** Wraps a route: connects to the DB, loads the session user, maps errors to JSON. */
export function route(fn: (ctx: { sql: Sql; me: Me | null; body: Record<string, unknown> }) => Promise<Response>) {
  return async (req: Request) => {
    try {
      const sql = await db();
      if (!sql) return json(NOT_SET_UP, 503);
      let body: Record<string, unknown> = {};
      if (req.method === "POST") {
        const ct = req.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) return json({ error: "Send JSON." }, 415);
        body = await req.json().catch(() => null);
        if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request body." }, 400);
      }
      const me = await currentUser(sql);
      return await fn({ sql, me, body });
    } catch (e) {
      if (e instanceof ActionError) return json({ error: e.message }, e.status);
      console.error("[sponsor-os]", e);
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}
