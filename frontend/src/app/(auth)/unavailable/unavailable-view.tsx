"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";

import { AuthCard } from "@features/auth";

const COPY = {
  vpn: {
    title: "VPN or proxy detected",
    description:
      "Please disable your VPN, proxy, or Tor and refresh the page to continue.",
  },
  region: {
    title: "Unavailable in your region",
    description:
      "This service is currently only available to users in the United States and Canada.",
  },
} as const;

const UnavailableInner = () => {
  const params = useSearchParams();
  const reason = params.get("reason") === "vpn" ? "vpn" : "region";
  const copy = COPY[reason];

  return (
    <AuthCard centered>
      <AuthCard.Header
        icon={ShieldAlert}
        title={copy.title}
        description={copy.description}
      />
    </AuthCard>
  );
};

export const UnavailableView = () => (
  <Suspense fallback={null}>
    <UnavailableInner />
  </Suspense>
);
