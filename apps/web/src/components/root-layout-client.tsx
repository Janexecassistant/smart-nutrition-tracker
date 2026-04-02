"use client";

import { Providers } from "@/components/providers";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import { InstallPrompt } from "@/components/install-prompt";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <InstallPrompt />
      <ServiceWorkerRegistrar />
    </Providers>
  );
}
