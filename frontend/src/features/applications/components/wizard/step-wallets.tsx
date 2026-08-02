import { useWatch, type Control } from "react-hook-form";
import { Info } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  APPLICATION_WIZARD_COPY,
  WALLET_CHAINS,
  type ApplicationFormValues,
  type WalletChain,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.wallets;

const CHAIN_META: Record<WalletChain, { label: string; placeholder: string }> = {
  evm: { label: "BSC", placeholder: "0x..." },
  solana: { label: "Solana", placeholder: "e.g. 7xKX..." },
  tron: { label: "Tron", placeholder: "T..." },
};

interface Props {
  control: Control<ApplicationFormValues>;
}

export const StepWallets = ({ control }: Props) => {
  // Drive the address placeholder off the currently selected chain.
  const chain = useWatch({ control, name: "wallet.chain" }) ?? "evm";

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="u-display text-xl">{COPY.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{COPY.hint}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {COPY.atLeastOneHint}
        </p>
      </div>

      <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          To minimize fees, stipends are paid in <strong>USDT</strong> on{" "}
          <strong>BNB Smart Chain</strong>, <strong>Solana</strong>, and{" "}
          <strong>Tron</strong> only. Make sure your wallet supports one of these
          networks.
        </p>
      </div>

      {/* A student has a single withdrawal address: pick the chain, enter it. */}
      <div className="flex gap-2 items-start">
        <FormField
          control={control}
          name="wallet.chain"
          render={({ field: chainField }) => (
            <FormItem className="w-36 shrink-0">
              <Select
                value={chainField.value}
                onValueChange={chainField.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WALLET_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHAIN_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="wallet.address"
          render={({ field: addrField }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder={CHAIN_META[chain].placeholder} {...addrField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
