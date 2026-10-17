import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/instrument-sans/standard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sponsor OS — sponsorship for grassroots sport", template: "%s · Sponsor OS" },
  description: "Athletes, teams, tournaments and leagues list sponsorship packages; brands discover them, match on fit and close deals in one place.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f4f1e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
