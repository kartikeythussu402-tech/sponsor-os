import Razorpay from "razorpay";
import { route, json } from "@/lib/server/http";
import { mapRazorpayError, razorpayConfigured } from "@/lib/server/payments";
import type { Deal, SponsorProfile } from "@/lib/types";

/* Step 1 of escrow: the sponsor asks to pay an accepted deal. The amount always comes
   from the deal in our database — never from the browser. */
export const POST = route(async ({ sql, me, body }) => {
  if (!razorpayConfigured()) return json({ error: "Payments aren't configured on this deployment." }, 503);
  if (!me) return json({ error: "Please log in first." }, 401);
  const dealId = typeof body.dealId === "string" ? body.dealId.slice(0, 40) : "";
  const [row] = await sql`select data from deals where id = ${dealId}`;
  if (!row) return json({ error: "Deal not found." }, 404);
  const deal = row.data as Deal;
  if (deal.sponsorId !== me.id) return json({ error: "Only the sponsor on this deal can pay it." }, 403);
  if (deal.status !== "accepted") return json({ error: "The deal must be accepted before paying." }, 400);
  if (deal.payment?.status && deal.payment.status !== "unpaid") return json({ error: "This deal is already paid." }, 409);
  if (deal.amount < 1) return json({ error: "This deal has no cash amount to pay." }, 400);

  const amount = deal.amount * 100; // paise
  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  let order: { id: string; amount: number | string; currency: string };
  try {
    order = await rzp.orders.create({ amount, currency: "INR", receipt: deal.id, notes: { deal_id: deal.id, sponsor_id: me.id } });
  } catch (e) {
    const m = mapRazorpayError(e);
    console.error("[sponsor-os] razorpay order failed", m.status);
    return json({ error: m.message }, m.status);
  }
  await sql`insert into payment_orders (order_id, deal_id, user_id, amount_paise) values (${order.id}, ${deal.id}, ${me.id}, ${amount})`;
  const brand = (me.profile as SponsorProfile).brand;
  return json({ orderId: order.id, amount: Number(order.amount), currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, name: brand, email: me.email });
});
