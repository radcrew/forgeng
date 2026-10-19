"use client";

import { AlertCircle, Mail } from "lucide-react";

import { SectionTitle } from "@components/common";
import { ErrorState } from "@components/shared";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";

export type WalletSectionProps = {
  /** Undefined until the payment info has loaded. */
  wallets: Array<{ chain: string; address: string }> | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onRemind: () => void;
  reminding: boolean;
};

/**
 * The user's wallet addresses. "No wallet address" shows only once the
 * payment info has loaded and really has none, never while it loads or after
 * it failed to load.
 */
export const WalletSection = ({
  wallets,
  isLoading,
  error,
  onRetry,
  onRemind,
  reminding,
}: WalletSectionProps) => (
  <div className="space-y-2">
    <SectionTitle>Wallet address</SectionTitle>
    {error ? (
      <ErrorState what="the payment info" onRetry={onRetry} size="compact" />
    ) : isLoading && !wallets ? (
      <Skeleton className="h-12 w-full" data-testid="wallet-placeholder" />
    ) : !wallets || wallets.length === 0 ? (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 space-y-2.5">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No wallet address added — payment cannot be processed.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={reminding}
          onClick={onRemind}
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          {reminding ? "Sending…" : "Email student to add wallet"}
        </Button>
      </div>
    ) : (
      <div className="space-y-3">
        {wallets.map((w) => (
          <div key={w.chain}>
            <p className="text-xs font-medium capitalize">{w.chain}</p>
            <p className="text-xs text-muted-foreground font-mono break-all mt-0.5">
              {w.address}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);
