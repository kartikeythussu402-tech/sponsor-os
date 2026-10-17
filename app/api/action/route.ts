import { runAction } from "@/lib/server/actions";
import { route, json } from "@/lib/server/http";
import { buildState } from "@/lib/server/state";

export const POST = route(async ({ sql, me, body }) => {
  const res = await runAction(sql, me, body);
  return json({ ok: true, ...res, db: await buildState(sql, me) });
});
