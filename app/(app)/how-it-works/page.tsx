import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works" };

const FIT = [
  ["Sport", "35", "Does the listing's sport match what the brand wants? Brands open to any sport score 25."],
  ["Region", "25", "Same state as the brand's target regions. Pan-India brands score 18."],
  ["Budget", "25", "At least one package priced within the brand's budget range."],
  ["Formats", "10", "Overlap between what the seeker offers (jersey, banners, sampling…) and what the brand prefers."],
  ["Level", "5", "Grassroots, district, state or national — matches the brand's preference."],
];

export default function HowItWorks() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">How it works</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">Sponsorship, without the guesswork</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        Most grassroots sport in India runs on WhatsApp forwards and personal favours. Sponsor OS gives athletes, teams, tournaments and leagues a professional way to pitch — and gives brands a way to find, compare and manage local sponsorships at scale.
      </p>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="display-tight text-xl">For sponsor-seekers</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>Create a listing: story, reach numbers, and 1–4 priced packages.</li>
            <li>Share your auto-generated sponsorship deck on WhatsApp or email.</li>
            <li>Browse sponsor briefs and pitch brands that fit.</li>
            <li>Negotiate in one thread; accept the deal.</li>
            <li>Tick off deliverables with proof so you get paid and renewed.</li>
          </ol>
        </div>
        <div className="card p-6">
          <h2 className="display-tight text-xl">For sponsors</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>Post a brief: sports, regions, budget, objectives.</li>
            <li>Discover listings ranked by fit score; shortlist favourites.</li>
            <li>Send offers on a package or a custom amount.</li>
            <li>Track committed spend, reach bought and cost per 1,000 reach.</li>
            <li>Mark deals complete once every deliverable is signed off.</li>
          </ol>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="display-tight text-2xl">The fit score (0–100)</h2>
        <p className="mt-2 text-ink-soft">Transparent and rule-based — every score shows its reasons and gaps.</p>
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line text-ink-mute">
              <tr><th className="p-4">Factor</th><th className="p-4">Max points</th><th className="p-4">What it checks</th></tr>
            </thead>
            <tbody>
              {FIT.map(([f, p, d]) => (
                <tr key={f} className="border-b border-line last:border-0">
                  <td className="p-4 font-semibold">{f}</td>
                  <td className="stat-num p-4 text-lg">{p}</td>
                  <td className="p-4 text-ink-soft">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="display-tight text-2xl">Payments &amp; escrow</h2>
        <p className="mt-2 text-ink-soft">Grassroots sponsorship breaks down on trust: teams worry about not getting paid, brands worry about not getting what they paid for. Escrow fixes both.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-4">
          {[
            ["Accept", "Both sides agree the amount and deliverables in the deal room."],
            ["Pay in", "The brand pays the full amount through Razorpay. It's held by Sponsor OS, not sent to the team yet."],
            ["Deliver", "The team ticks off each deliverable with proof — posts, photos, match dates."],
            ["Release", "The brand approves; the team is paid out, minus a 5% platform fee."],
          ].map(([t, d], i) => (
            <li key={t} className="card p-5">
              <p className="stat-num text-2xl text-turf-3">0{i + 1}</p>
              <p className="mt-1 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-mute">Every payment is checked on our server with Razorpay&apos;s HMAC signature before a deal is marked paid; the amount always comes from the deal record, never from the browser. This deployment runs in Razorpay test mode, so no real money moves. Payouts to teams are recorded in the deal; in production they would go out through RazorpayX Payouts or Route.</p>
      </section>

      <section className="mt-12 rounded-3xl bg-ink p-8 text-white">
        <h2 className="display-tight text-2xl">Try it in two minutes</h2>
        <p className="mt-3 text-white/80">
          Log in with the demo brand, send an offer to Rohtak Rangers. Log out, log in as the demo team and accept it. Back as the brand, pay into escrow. As the team, tick off the deliverables. Finally, as the brand, approve and release the payment. The sample teams and brands are fictional.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login/" className="btn btn-lime">Demo logins</Link>
          <Link href="/signup/" className="btn border border-white/30 text-white hover:bg-white/10">Create an account</Link>
        </div>
      </section>
    </div>
  );
}
