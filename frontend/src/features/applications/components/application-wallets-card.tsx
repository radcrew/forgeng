import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { CopyButton } from "./copy-button";

const CHAIN_LABELS: Record<string, string> = {
  evm: "EVM",
  solana: "Solana",
  tron: "Tron",
};

export type ApplicationWalletsCardProps = {
  wallets: Array<{ chain: string; address: string }>;
};

export function ApplicationWalletsCard({ wallets }: ApplicationWalletsCardProps) {
  if (wallets.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wallet Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {wallets.map((w, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              {CHAIN_LABELS[w.chain] ?? w.chain}
            </p>
            <div className="flex items-center">
              <span className="font-mono text-xs break-all">{w.address}</span>
              <CopyButton text={w.address} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
