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
  title: "Forgeng",
  description:
    "A rigorous, mentor-led apprenticeship for aspiring software engineers — apply, join a cohort, complete real projects, and grow.",
  icons: {
    icon: [{ url: "/icon.png", sizes: "256x256", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Forgeng",
    description:
      "A rigorous, mentor-led apprenticeship for aspiring software engineers.",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Forgeng",
    description:
      "A rigorous, mentor-led apprenticeship for aspiring software engineers.",
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
