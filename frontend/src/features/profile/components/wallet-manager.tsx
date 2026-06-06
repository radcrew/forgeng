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
import {
  WALLET_CHAINS,
  type WalletChain,
} from "@constants/applications";
import { ApiError } from "@lib/api-client";

import { getWallets, updateWallets, type WalletEntry } from "../api";

const CHAIN_LABELS: Record<WalletChain, string> = {
  evm: "BSC (EVM)",
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
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChain, setNewChain] = useState<WalletChain>("evm");
  const [newAddress, setNewAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    getWallets()
      .then(setWallets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: WalletEntry[]) => {
    setSaving(true);
    try {
      const saved = await updateWallets(next);
      setWallets(saved);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update wallets.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const addr = newAddress.trim();
    if (!addr) {
      setAddressError("Address is required.");
      return;
    }
    if (!ADDRESS_PATTERNS[newChain].test(addr)) {
      setAddressError(`Invalid ${CHAIN_LABELS[newChain]} address.`);
      return;
    }
    if (wallets.some((w) => w.address === addr)) {
      setAddressError("This address is already added.");
      return;
    }
    setAddressError("");
    await save([...wallets, { chain: newChain, address: addr }]);
    setNewAddress("");
    toast.success("Wallet added.");
  };

  const handleRemove = async (address: string) => {
    await save(wallets.filter((w) => w.address !== address));
    toast.success("Wallet removed.");
  };

  const usedChains = new Set(wallets.map((w) => w.chain));
  const availableChains = WALLET_CHAINS.filter((c) => !usedChains.has(c));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Wallet Addresses</CardTitle>
        <p className="text-sm text-muted-foreground">
          Used to receive your monthly stipend. Add one per chain.
        </p>
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Stipends are paid in <strong>USDT</strong> on{" "}
            <strong>BNB Smart Chain</strong>, <strong>Solana</strong>, and{" "}
            <strong>Tron</strong> only. Add a wallet on one of these networks to
            receive your payment.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing wallets */}
        {!loading && wallets.length > 0 && (
          <div className="space-y-2">
            {wallets.map((w) => (
              <div
                key={w.address}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
              >
                <span className="text-xs font-medium uppercase text-muted-foreground w-12 shrink-0">
                  {CHAIN_LABELS[w.chain as WalletChain] ?? w.chain}
                </span>
                <span className="flex-1 font-mono text-xs truncate">
                  {w.address}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={saving}
                  onClick={() => handleRemove(w.address)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new wallet */}
        {availableChains.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Add wallet</Label>
            <div className="flex gap-2">
              <Select
                value={newChain}
                onValueChange={(v) => {
                  setNewChain(v as WalletChain);
                  setAddressError("");
                }}
              >
                <SelectTrigger className="w-[110px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableChains.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHAIN_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 space-y-1">
                <Input
                  placeholder={CHAIN_PLACEHOLDERS[newChain]}
                  value={newAddress}
                  onChange={(e) => {
                    setNewAddress(e.target.value);
                    setAddressError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
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
                disabled={saving}
                onClick={handleAdd}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {!loading && wallets.length === 0 && availableChains.length === 0 && (
          <p className="text-sm text-muted-foreground">
            All supported chains have been added.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
