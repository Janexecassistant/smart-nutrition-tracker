"use client";

import dynamic from "next/dynamic";

// Completely disable SSR for Providers to prevent useContext errors
// during Next.js static page generation (/_error, /404)
const Providers = dynamic(
  () => import("@/components/providers").then((mod) => ({ default: mod.Providers })),
  { ssr: false }
);
const InstallPrompt = dynamic(
  () => import("@/components/install-prompt").then((mod) => ({ default: mod.InstallPrompt })),
  { ssr: false }
);
const ServiceWorkerRegistrar = dynamic(
  () => import("@/components/sw-registrar").then((mod) => ({ default: mod.ServiceWorkerRegistrar })),
  { ssr: false }
);

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <InstallPrompt />
      <ServiceWorkerRegistrar />
    </Providers>
  );
}
