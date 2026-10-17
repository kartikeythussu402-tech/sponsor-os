import { SiteFooter, SiteHeader, StatusGate } from "@/components/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <StatusGate>{children}</StatusGate>
      </main>
      <SiteFooter />
    </>
  );
}
