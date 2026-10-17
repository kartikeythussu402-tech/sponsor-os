import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PLATFORM_FEE } from "../types";

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Razorpay Standard Checkout signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex. */
export function expectedSignature(orderId: string, paymentId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function isValidSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const a = Buffer.from(expectedSignature(orderId, paymentId, secret));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Platform fee kept on release, and the seeker's payout (whole rupees). */
export function split(amount: number) {
  const fee = Math.round(amount * PLATFORM_FEE);
  return { fee, payout: amount - fee };
}

export function mapRazorpayError(e: unknown): { status: number; message: string } {
  const err = (e ?? {}) as { statusCode?: number; error?: { description?: string } };
  if (err.statusCode === 401) return { status: 401, message: "Payment provider rejected our credentials. Please contact support." };
  if (err.statusCode === 400) return { status: 500, message: err.error?.description ? `Payment provider error: ${err.error.description}` : "Payment provider rejected the order." };
  return { status: 500, message: "Couldn't reach the payment provider. Please try again in a moment." };
}
