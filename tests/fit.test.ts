import { test } from "node:test";
import assert from "node:assert/strict";
import { bestFit, fitScore, fitTone } from "../lib/fit";
import { seedData } from "../lib/seed";
import { inr, inrShort } from "../lib/format";

const db = seedData();
const L = (id: string) => db.listings.find((l) => l.id === id)!;
const B = (id: string) => db.briefs.find((b) => b.id === id)!;

test("scores are bounded 0-100 for every pair", () => {
  for (const l of db.listings) for (const b of db.briefs) {
    const f = fitScore(l, b);
    assert.ok(f.score >= 0 && f.score <= 100);
    assert.ok(f.reasons.length + f.gaps.length > 0);
  }
});

test("home-state kabaddi club fits Kesar Fizz brief strongly", () => {
  const f = fitScore(L("ls_rohtak"), B("br_me"));
  assert.ok(f.score >= 75, `got ${f.score}`);
  assert.equal(fitTone(f.score), "high");
});

test("mismatched sport and region is penalised with gaps", () => {
  const b = { ...B("br_me"), sports: ["Cricket"], states: ["Kerala"], budgetMin: 1, budgetMax: 2 };
  const f = fitScore(L("ls_shillong"), b);
  assert.ok(f.score < 50);
  assert.ok(f.gaps.length >= 2);
});

test("bestFit picks the highest-scoring brief", () => {
  const best = bestFit(L("ls_rohtak"), db.briefs)!;
  for (const b of db.briefs) assert.ok(best.score >= fitScore(L("ls_rohtak"), b).score);
  assert.equal(bestFit(L("ls_rohtak"), []), null);
});

test("INR formatting", () => {
  assert.equal(inr(150000), "₹1,50,000");
  assert.equal(inrShort(150000), "₹1.5L");
});
