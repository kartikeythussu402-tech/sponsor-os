import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <PolicyPage title="Privacy Policy" intro="This policy explains what personal data Sponsor OS (www.sponsoros.shop) collects, why, and how we protect it.">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> email address, a hashed password (we never store your actual password), and your team, athlete or brand name, city and state.</li>
          <li><strong>Content you add:</strong> listings, briefs, messages in deal rooms, deliverable proofs.</li>
          <li><strong>Payment records:</strong> Razorpay order and payment IDs and amounts. Card, UPI and bank details are handled only by Razorpay and never reach our servers.</li>
          <li><strong>Technical data:</strong> a login cookie to keep you signed in, and basic usage analytics to improve the site.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To run your account, show your listings or briefs, and operate deals and payments.</li>
          <li>To prevent fraud and keep the platform secure.</li>
          <li>To contact you about your account or deals. We do not send marketing without your consent.</li>
        </ul>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <ul>
          <li>Your public profile, listings and briefs are visible to other users. Your email address is not shown publicly.</li>
          <li>Messages and deal details are visible only to the two parties in that deal.</li>
          <li>Service providers who run the platform for us: Razorpay (payments), Vercel (hosting) and our database provider. We do not sell your data.</li>
        </ul>
      </section>
      <section>
        <h2>Security and retention</h2>
        <p>Data is sent over HTTPS, passwords are hashed with scrypt, and payment signatures are verified on our server. We keep your data while your account is active and as required for tax and accounting records.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>You can view and edit your profile at any time. To get a copy of your data or delete your account, email us and we will act within 30 days, in line with India&apos;s Digital Personal Data Protection Act, 2023.</p>
      </section>
    </PolicyPage>
  );
}
