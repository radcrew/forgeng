import { type Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.basicInfo;

interface Props {
  control: Control<ApplicationFormValues>;
  user: { email?: string } | null | undefined;
}

export const StepBasicInfo = ({ control, user }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="u-display text-xl">{COPY.title}</h2>
    <p className="text-sm text-muted-foreground">{COPY.accountHint}</p>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{COPY.nameLabel}</FormLabel>
            <FormControl>
              <Input placeholder={COPY.namePlaceholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="space-y-2">
        <Label>{COPY.emailLabel}</Label>
        <Input value={user?.email ?? "—"} disabled readOnly />
      </div>
    </div>
  </div>
);
