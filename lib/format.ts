/** ₹ in Indian grouping: 125000 → ₹1,25,000; compact: ₹1.25L, ₹2.5Cr */
export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (n >= 1e3) return `₹${trim(n / 1e3)}k`;
  return `₹${n}`;
}

export function count(n: number): string {
  if (n >= 1e7) return `${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `${trim(n / 1e5)}L`;
  if (n >= 1e3) return `${trim(n / 1e3)}k`;
  return String(n);
}

function trim(x: number) {
  return (Math.round(x * 10) / 10).toString().replace(/\.0$/, "");
}

export function uid(prefix = ""): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return prefix + Array.from(a, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function niceDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function totalReach(a: { instagram: number; youtube: number; whatsapp: number; attendance: number }) {
  return a.instagram + a.youtube + a.whatsapp + a.attendance;
}
