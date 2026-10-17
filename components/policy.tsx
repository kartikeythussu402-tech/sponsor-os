import { CONTACT } from "@/lib/contact";

export const UPDATED = "17 October 2026";

/** Shared layout for the legal / policy pages. */
export function PolicyPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Policies</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-mute">Last updated: {UPDATED}</p>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">{intro}</p>
      <div className="policy mt-8 flex flex-col gap-7 leading-relaxed text-ink-soft [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
        <section>
          <h2>Contact</h2>
          <p>
            Sponsor OS is operated by Kartikey Thussu, India. For any question about this policy, write to{" "}
            <a className="font-semibold text-turf-3 underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{" "}
            <a className="font-semibold text-turf-3 underline" href={`tel:+${CONTACT.phoneRaw}`}>{CONTACT.phone}</a>. We reply within 2 working days.
          </p>
        </section>
      </div>
    </div>
  );
}
