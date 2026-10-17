"use client";
import { useEffect, useSyncExternalStore } from "react";
import type { Brief, DB, DealStatus, Listing, SeekerProfile, SponsorProfile } from "./types";

/* Client cache of what the server says this visitor can see. Reads come from GET /api/state;
   every write is POSTed to /api/action, which validates it and returns the fresh state. */

const EMPTY: DB = {
  version: 1,
  user: null,
  role: null,
  me: {
    seeker: { id: "", name: "", kind: "team", city: "", state: "Haryana", sport: "Kabaddi" },
    sponsor: { id: "", brand: "", industry: "", city: "", state: "Haryana" },
  },
  sponsors: [],
  seekers: [],
  listings: [],
  briefs: [],
  deals: [],
  saved: [],
  raised: {},
  backers: {},
  paymentsEnabled: false,
};

export type LoadState = "loading" | "ready" | "setup" | "error";

let state: DB = EMPTY;
let status: LoadState = "loading";
let started = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function setState(next: DB) {
  state = next;
  status = "ready";
  emit();
}

export function refresh(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/state/", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (res.status === 503 && body?.setup) status = "setup";
      else if (!res.ok || !body) status = state === EMPTY ? "error" : status;
      else {
        state = body as DB;
        status = "ready";
      }
    } catch {
      if (state === EMPTY) status = "error";
    } finally {
      inflight = null;
      emit();
    }
  })();
  return inflight;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refresh();
  // Keep deal threads fresh when the other side replies.
  setInterval(() => document.visibilityState === "visible" && void refresh(), 15000);
  window.addEventListener("focus", () => void refresh());
}

export function useDB(): DB {
  useEffect(start, []);
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function useLoadState(): LoadState {
  useEffect(start, []);
  return useSyncExternalStore(subscribe, () => status, () => "loading" as LoadState);
}

export function getDB(): DB {
  return state;
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("You seem to be offline. Please try again.");
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
  if (data.db) setState(data.db as DB);
  return data;
}

const act = async (type: string, args: Record<string, unknown> = {}) => (await post("/api/action/", { type, ...args })).id as string | undefined;

export const auth = {
  async login(email: string, password: string) {
    await post("/api/auth/login/", { email, password });
    await refresh();
  },
  async demo(role: "seeker" | "sponsor") {
    await post("/api/auth/login/", { demo: role });
    await refresh();
  },
  async signup(input: Record<string, string>) {
    await post("/api/auth/signup/", input);
    await refresh();
  },
  async logout() {
    await post("/api/auth/logout/", {});
    await refresh();
  },
};

export const actions = {
  updateProfile: (patch: Partial<SeekerProfile> | Partial<SponsorProfile>) => act("updateProfile", { patch }),
  saveListing: async (listing: Omit<Listing, "id" | "createdAt" | "ownerId"> & { id?: string }) => (await act("saveListing", { listing }))!,
  deleteListing: (id: string) => act("deleteListing", { id }),
  saveBrief: async (brief: Omit<Brief, "id" | "createdAt" | "ownerId" | "brand" | "industry"> & { id?: string }) => (await act("saveBrief", { brief }))!,
  deleteBrief: (id: string) => act("deleteBrief", { id }),
  toggleSave: (listingId: string) => act("toggleSave", { listingId }),
  /** Sponsor → listing offer, or seeker → brief pitch. The server works out who is who. */
  createDeal: async (input: { listingId: string; briefId: string | null; packageId: string | null; amount: number; inKind: string; message: string }) => (await act("createDeal", input))!,
  sendMessage: (dealId: string, text: string) => act("sendMessage", { dealId, text }),
  counter: (dealId: string, amount: number, note: string) => act("counter", { dealId, amount, note }),
  setStatus: (dealId: string, status: DealStatus) => act("setStatus", { dealId, status }),
  toggleDeliverable: (dealId: string, delId: string) => act("toggleDeliverable", { dealId, delId }),
  setProof: (dealId: string, delId: string, proof: string) => act("setProof", { dealId, delId, proof }),
  addDeliverable: (dealId: string, text: string) => act("addDeliverable", { dealId, text }),
};

/** Total committed (accepted/completed) per listing — computed on the server across all deals. */
export function raisedFor(db: DB, listingId: string): number {
  return db.raised[listingId] ?? 0;
}
