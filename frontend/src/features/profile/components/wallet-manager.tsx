"use client";

import { useEffect, useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { WALLET_CHAINS, type WalletChain } from "@constants/applications";
import { ApiError } from "@lib/api-client";

import { getWallets, updateWallets } from "../api";

const CHAIN_LABELS: Record<WalletChain, string> = {
  evm: "BSC",
  solana: "Solana",
  tron: "Tron",
};

const CHAIN_PLACEHOLDERS: Record<WalletChain, string> = {
  evm: "0x…",
  solana: "e.g. 7xKX…",
  tron: "T…",
};

const ADDRESS_PATTERNS: Record<WalletChain, RegExp> = {
  evm: /^0x[0-9a-fA-F]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

export function WalletManager() {
  const [chain, setChain] = useState<WalletChain>("evm");
  const [address, setAddress] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    getWallets()
      .then((wallets) => {
        // A student has at most one withdrawal address.
        const current = wallets[0];
        if (current) {
          setChain(current.chain as WalletChain);
          setAddress(current.address);
          setHasWallet(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const addr = address.trim();
    if (!addr) {
      setAddressError("Address is required.");
      return;
    }
    if (!ADDRESS_PATTERNS[chain].test(addr)) {
      setAddressError(`Invalid ${CHAIN_LABELS[chain]} address.`);
      return;
    }
    setAddressError("");
    setSaving(true);
    try {
      const saved = await updateWallets([{ chain, address: addr }]);
      const current = saved[0];
      setChain((current?.chain as WalletChain) ?? chain);
      setAddress(current?.address ?? addr);
      setHasWallet(true);
      toast.success("Wallet saved.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update wallet.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateWallets([]);
      setChain("evm");
      setAddress("");
      setHasWallet(false);
      setAddressError("");
      toast.success("Wallet removed.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove wallet.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Withdrawal Address</CardTitle>
        <p className="text-sm text-muted-foreground">
          Used to receive your monthly stipend. You can set a single address.
        </p>
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Stipends are paid in <strong>USDT</strong> on{" "}
            <strong>BNB Smart Chain</strong>, <strong>Solana</strong>, and{" "}
            <strong>Tron</strong> only. Set a wallet on one of these networks to
            receive your payment.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {hasWallet ? "Your withdrawal address" : "Add withdrawal address"}
        </Label>
        <div className="flex gap-2">
          <Select
            value={chain}
            onValueChange={(v) => {
              setChain(v as WalletChain);
              setAddressError("");
            }}
          >
            <SelectTrigger className="w-[110px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WALLET_CHAINS.map((c) => (
                <SelectItem key={c} value={c}>
                  {CHAIN_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 space-y-1">
            <Input
              placeholder={CHAIN_PLACEHOLDERS[chain]}
              value={address}
              disabled={loading || saving}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              className={addressError ? "border-destructive" : ""}
            />
            {addressError && (
              <p className="text-xs text-destructive">{addressError}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading || saving}
            onClick={handleSave}
            className="shrink-0"
          >
            Save
          </Button>
          {hasWallet && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              disabled={saving}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
