import { route, json } from "@/lib/server/http";
import { buildState } from "@/lib/server/state";

export const dynamic = "force-dynamic";

export const GET = route(async ({ sql, me }) => json(await buildState(sql, me)));
