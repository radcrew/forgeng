import { type Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.wallets;

interface Props {
  control: Control<ApplicationFormValues>;
}

type WalletField = {
  name: keyof ApplicationFormValues;
  label: string;
  description: string;
  placeholder: string;
};

const FIELDS: WalletField[] = [
  { name: "walletEvm", label: COPY.evmLabel, description: COPY.evmDescription, placeholder: COPY.evmPlaceholder },
  { name: "walletSolana", label: COPY.solanaLabel, description: COPY.solanaDescription, placeholder: COPY.solanaPlaceholder },
  { name: "walletTron", label: COPY.tronLabel, description: COPY.tronDescription, placeholder: COPY.tronPlaceholder },
];

export const StepWallets = ({ control }: Props) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h2 className="text-xl font-semibold">{COPY.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{COPY.hint}</p>
      <p className="mt-1 text-xs text-muted-foreground">{COPY.atLeastOneHint}</p>
    </div>
    {FIELDS.map(({ name, label, description, placeholder }) => (
      <FormField
        key={name}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
            <FormControl>
              <Input placeholder={placeholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))}
  </div>
);
