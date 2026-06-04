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

export const StepWallets = ({ control }: Props) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h2 className="text-xl font-semibold">{COPY.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{COPY.hint}</p>
      <p className="mt-1 text-xs text-muted-foreground">{COPY.atLeastOneHint}</p>
    </div>

    <FormField
      control={control}
      name="walletEvm"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.evmLabel}</FormLabel>
          <FormDescription>{COPY.evmDescription}</FormDescription>
          <FormControl>
            <Input placeholder={COPY.evmPlaceholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="walletSolana"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.solanaLabel}</FormLabel>
          <FormDescription>{COPY.solanaDescription}</FormDescription>
          <FormControl>
            <Input placeholder={COPY.solanaPlaceholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="walletTron"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.tronLabel}</FormLabel>
          <FormDescription>{COPY.tronDescription}</FormDescription>
          <FormControl>
            <Input placeholder={COPY.tronPlaceholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);
