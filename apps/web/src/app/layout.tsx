import type { Metadata, Viewport } from "next";
import { RootLayoutClient } from "@/components/root-layout-client";
import "./globals.css";

// Prevent static generation to avoid useContext errors during SSR
// The RootLayoutClient provider is client-side only
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart Nutrition Tracker",
  description:
    "Track your food, hit your goals, and get smart suggestions for what to eat next.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SNT",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
