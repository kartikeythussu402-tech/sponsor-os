import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const cards = [
    { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}?subject=${encodeURIComponent("Sponsor OS enquiry")}`, cta: "Send an email" },
    { icon: Phone, label: "Phone", value: CONTACT.phone, href: `tel:+${CONTACT.phoneRaw}`, cta: "Call" },
    { icon: MessageCircle, label: "WhatsApp", value: CONTACT.phone, href: `https://wa.me/${CONTACT.phoneRaw}?text=${encodeURIComponent("Hi! I have a question about Sponsor OS.")}`, cta: "Chat on WhatsApp" },
  ];
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <p className="eyebrow text-turf-3">Contact</p>
      <h1 className="display mt-2 text-4xl uppercase sm:text-5xl">Talk to us</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">Questions about listing your team, sponsoring an event, or payments? Reach out and we&apos;ll get back to you.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value, href, cta }) => (
          <a key={label} href={href} target={label === "WhatsApp" ? "_blank" : undefined} rel={label === "WhatsApp" ? "noopener noreferrer" : undefined} className="card flex flex-col gap-3 p-6 transition-transform hover:-translate-y-0.5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-turf text-lime"><Icon size={20} aria-hidden="true" /></span>
            <span className="eyebrow text-ink-mute">{label}</span>
            <span className="break-all font-semibold">{value}</span>
            <span className="mt-auto text-sm font-semibold text-turf-3 underline underline-offset-2">{cta}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
