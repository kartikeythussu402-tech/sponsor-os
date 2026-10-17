import { uid } from "@/lib/format";
import { route, json } from "@/lib/server/http";
import { isValidSignature, razorpayConfigured } from "@/lib/server/payments";
import { buildState } from "@/lib/server/state";
import { UNPAID, type Deal } from "@/lib/types";

/* Step 2: Razorpay hands the browser three values; we check the HMAC signature with our
   secret. Only a valid signature moves the deal's money into "held in escrow". */
export const POST = route(async ({ sql, me, body }) => {
  if (!razorpayConfigured()) return json({ error: "Payments aren't configured on this deployment." }, 503);
  if (!me) return json({ error: "Please log in first." }, 401);
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) return json({ error: "Missing payment details." }, 400);
  if (!isValidSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET!)) {
    return json({ verified: false, error: "Payment signature didn't match, so it wasn't recorded. If money was deducted, contact support with your payment ID." }, 400);
  }

  const result = await sql.begin(async (tx) => {
    const [o] = await tx`select * from payment_orders where order_id = ${orderId} for update`;
    if (!o || o.user_id !== me.id) return { status: 404, error: "We couldn't find this order." };
    const [row] = await tx`select data from deals where id = ${o.deal_id} for update`;
    if (!row) return { status: 404, error: "Deal not found." };
    const raw = row.data as Deal;
    const deal: Deal = { ...raw, payment: raw.payment ?? UNPAID };
    if (o.status === "paid" || deal.payment.status !== "unpaid") return { status: 200 }; // idempotent retry
    const at = new Date().toISOString();
    const next: Deal = {
      ...deal,
      payment: { ...UNPAID, status: "held", orderId, paymentId, paidAt: at },
      messages: [...deal.messages, { id: uid("m"), from: "sponsor", text: `✓ Sponsor paid ₹${deal.amount.toLocaleString("en-IN")} into escrow (payment ${paymentId}). Released to the seeker when all deliverables are signed off.`, at }],
      updatedAt: at,
    };
    await tx`update payment_orders set status = 'paid', payment_id = ${paymentId} where order_id = ${orderId}`;
    await tx`update deals set data = ${tx.json(next as never)}, updated_at = ${at} where id = ${deal.id}`;
    return { status: 200 };
  });
  if (result.status !== 200) return json({ verified: true, error: result.error }, result.status);
  return json({ verified: true, paymentId, db: await buildState(sql, me) });
});
