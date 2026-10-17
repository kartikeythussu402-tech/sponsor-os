import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { hashPassword, verifyPassword } from "../lib/server/password";

// payments.ts / session.ts import "server-only", so the pure pieces are re-checked here.
const sig = (o: string, p: string, s: string) => createHmac("sha256", s).update(`${o}|${p}`).digest("hex");

test("razorpay signature format", () => {
  assert.equal(sig("order_1", "pay_1", "secret").length, 64);
  assert.notEqual(sig("order_1", "pay_1", "secret"), sig("order_1", "pay_2", "secret"));
});

test("password hashing round-trips and rejects wrong passwords", async () => {
  const h = await hashPassword("demo1234");
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  assert.equal(await verifyPassword("demo1234", h), true);
  assert.equal(await verifyPassword("demo12345", h), false);
  assert.equal(await verifyPassword("x", "garbage"), false);
});
