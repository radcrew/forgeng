import { useFieldArray, type Control } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@components/ui/button";
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

const CHAIN_META: Record<
  WalletChain,
  { label: string; description: string; placeholder: string }
> = {
  evm: {
    label: "EVM",
    description: "Ethereum, BNB Chain, Base, Arbitrum, Optimism, ...",
    placeholder: "0x...",
  },
  solana: {
    label: "Solana",
    description: "Solana network",
    placeholder: "e.g. 7xKX...",
  },
  tron: {
    label: "Tron",
    description: "Tron network",
    placeholder: "T...",
  },
};

interface Props {
  control: Control<ApplicationFormValues>;
}

export const StepWallets = ({ control }: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "wallets",
  });

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-semibold">{COPY.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{COPY.hint}</p>
        <p className="mt-1 text-xs text-muted-foreground">{COPY.atLeastOneHint}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const chain = field.chain as WalletChain;
          const meta = CHAIN_META[chain] ?? CHAIN_META.evm;

          return (
            <div key={field.id} className="flex gap-2 items-start">
              {/* Chain selector */}
              <FormField
                control={control}
                name={`wallets.${index}.chain`}
                render={({ field: chainField }) => (
                  <FormItem className="w-36 shrink-0">
                    <Select
                      value={chainField.value}
                      onValueChange={(val) => {
                        chainField.onChange(val);
                      }}
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

              {/* Address input */}
              <FormField
                control={control}
                name={`wallets.${index}.address`}
                render={({ field: addrField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={meta.placeholder}
                        {...addrField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {fields.length < WALLET_CHAINS.length && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ chain: "evm" as const, address: "" })}
        >
          + Add another wallet
        </Button>
      )}
    </div>
  );
};
