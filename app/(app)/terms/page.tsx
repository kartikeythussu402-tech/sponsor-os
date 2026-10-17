import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function Terms() {
  return (
    <PolicyPage title="Terms & Conditions" intro="These terms govern your use of Sponsor OS (www.sponsoros.shop), an online marketplace where athletes, teams, tournaments, leagues and event organisers (“seekers”) list sponsorship packages and brands (“sponsors”) buy them. By creating an account or making a payment you agree to these terms.">
      <section>
        <h2>1. Accounts</h2>
        <ul>
          <li>You must be at least 18 years old and give accurate information about yourself, your team or your brand.</li>
          <li>You are responsible for keeping your password safe and for everything done through your account.</li>
          <li>We may suspend accounts that post false information, misuse the platform or break the law.</li>
        </ul>
      </section>
      <section>
        <h2>2. Listings and briefs</h2>
        <ul>
          <li>Seekers are responsible for the accuracy of their listings: audience numbers, dates, deliverables and prices.</li>
          <li>Sponsors are responsible for the accuracy of their briefs and for the content they ask seekers to display.</li>
          <li>Content must not be unlawful, misleading, hateful or infringe anyone&apos;s rights. We may remove content that does.</li>
        </ul>
      </section>
      <section>
        <h2>3. Deals, pricing and fees</h2>
        <ul>
          <li>A deal is formed when one side accepts the other&apos;s offer in the deal room. The agreed amount, package and deliverables shown in the deal room are the terms of that deal.</li>
          <li>All prices are in Indian Rupees (INR). Listing on Sponsor OS is free. Sponsor OS keeps a <strong>5% platform fee</strong> from the deal amount when funds are released to the seeker; the sponsor pays the agreed deal amount and nothing more.</li>
        </ul>
      </section>
      <section>
        <h2>4. Payments and escrow</h2>
        <ul>
          <li>Payments are processed securely by Razorpay. We never see or store your card, UPI or bank login details.</li>
          <li>After a deal is accepted, the sponsor pays the agreed amount. It is held by Sponsor OS until the sponsor confirms that all deliverables are complete, and is then released to the seeker minus the platform fee.</li>
          <li>Refunds and cancellations are covered by our <a className="font-semibold text-turf-3 underline" href="/refunds/">Refund &amp; Cancellation Policy</a>.</li>
        </ul>
      </section>
      <section>
        <h2>5. Delivery of services</h2>
        <p>Sponsor OS is a digital service; nothing is shipped physically. Sponsorship deliverables (logo placement, social posts, appearances and similar) are provided by the seeker on the dates agreed in the deal, and are tracked with proof in the deal room. Access to the platform is available immediately after sign-up.</p>
      </section>
      <section>
        <h2>6. Our role and liability</h2>
        <p>Sponsor OS provides the marketplace, deal tools and payment handling. The sponsorship itself is between the sponsor and the seeker. To the extent allowed by law, Sponsor OS is not liable for indirect losses, and our total liability for any deal is limited to the platform fee we earned on it.</p>
      </section>
      <section>
        <h2>7. Changes and governing law</h2>
        <p>We may update these terms; the date above shows the latest version. These terms are governed by the laws of India, and disputes are subject to the courts of New Delhi.</p>
      </section>
    </PolicyPage>
  );
}
