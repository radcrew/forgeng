import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { NavigationLoader } from "@components/common";
import { Toaster } from "@components/ui/sonner";
import { AppProviders } from "@providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Forgeng — Software Engineering Apprenticeship",
    template: "%s | Forgeng",
  },
  description:
    "A rigorous, mentor-led apprenticeship for aspiring software engineers in the US and Canada. Complete real projects, earn a monthly stipend, get expert code reviews, and grow into a professional engineer — no CS degree required.",
  keywords: [
    "software engineering apprenticeship",
    "learn software engineering",
    "mentorship for developers",
    "coding apprenticeship",
    "earn while you learn programming",
    "software engineering cohort",
    "developer training program",
    "no CS degree required",
    "real projects new developers",
  ],
  authors: [{ name: "Forgeng" }],
  creator: "Forgeng",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.png", sizes: "256x256", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Forgeng — Software Engineering Apprenticeship",
    description:
      "A rigorous, mentor-led apprenticeship where you earn a monthly stipend while learning software engineering. Complete real projects, get expert code reviews, no CS degree required.",
    url: "/",
    siteName: "Forgeng",
    images: [{ url: "/logo.png", alt: "Forgeng" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgeng — Software Engineering Apprenticeship",
    description:
      "A rigorous, mentor-led apprenticeship where you earn a monthly stipend while learning software engineering.",
    images: ["/logo.png"],
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  >
    <body className="min-h-full">
      <AppProviders>
        {children}
        <NavigationLoader />
      </AppProviders>
      <Toaster position="top-right" richColors closeButton />
    </body>
  </html>
);

export default RootLayout;
