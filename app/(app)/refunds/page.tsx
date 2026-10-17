import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

export default function Refunds() {
  return (
    <PolicyPage title="Refund & Cancellation" intro="Sponsor payments on Sponsor OS are held in escrow until the sponsor approves the deliverables, so sponsors are protected if a deal doesn't go ahead.">
      <section>
        <h2>Before payment</h2>
        <p>Either side can decline, withdraw or cancel an offer at any time before the sponsor pays. Nothing is charged.</p>
      </section>
      <section>
        <h2>After payment, before release</h2>
        <ul>
          <li>If the seeker cannot deliver, or both sides agree to cancel, the sponsor receives a <strong>full refund</strong> of the amount paid, including the platform fee.</li>
          <li>If only some deliverables were completed, both sides may agree a partial refund in the deal room; we refund the agreed amount.</li>
          <li>To request a cancellation or refund, email us with the deal link and reason. We respond within 2 working days.</li>
        </ul>
      </section>
      <section>
        <h2>After release</h2>
        <p>Once the sponsor has approved the deliverables and the payment has been released to the seeker, the deal is complete and is not refundable through Sponsor OS. Any later dispute is between the sponsor and the seeker.</p>
      </section>
      <section>
        <h2>Refund timelines</h2>
        <p>Approved refunds are issued through Razorpay to the original payment method within <strong>5–7 working days</strong>. Your bank may take a little longer to show the credit.</p>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>Sponsor OS is an online service; there are no physical goods or shipping. Sponsorship deliverables are provided by the seeker on the dates agreed in the deal room.</p>
      </section>
    </PolicyPage>
  );
}
