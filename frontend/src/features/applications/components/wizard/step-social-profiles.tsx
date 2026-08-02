import { type Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  type ApplicationFormValues,
} from "@constants/applications";
import { APPLICATION_COUNTRY_OPTIONS } from "@constants/shared/countries";

const COPY = APPLICATION_WIZARD_COPY.steps.socialProfiles;

type SocialProfileFieldName =
  | "linkedin" | "github" | "twitter" | "facebook"
  | "telegram" | "whatsapp" | "portfolio";

type SocialField = {
  name: SocialProfileFieldName;
  label: string;
  placeholder: string;
  required?: boolean;
};

const FIELDS: SocialField[] = [
  { name: "linkedin", label: COPY.linkedinLabel, placeholder: COPY.linkedinPlaceholder, required: true },
  { name: "github", label: COPY.githubLabel, placeholder: COPY.githubPlaceholder, required: true },
  { name: "twitter", label: COPY.twitterLabel, placeholder: COPY.twitterPlaceholder },
  { name: "facebook", label: COPY.facebookLabel, placeholder: COPY.facebookPlaceholder },
  { name: "telegram", label: COPY.telegramLabel, placeholder: COPY.telegramPlaceholder },
  { name: "whatsapp", label: COPY.whatsappLabel, placeholder: COPY.whatsappPlaceholder },
  { name: "portfolio", label: COPY.portfolioLabel, placeholder: COPY.portfolioPlaceholder },
];

interface Props {
  control: Control<ApplicationFormValues>;
}

export const StepSocialProfiles = ({ control }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="u-display text-xl">{COPY.title}</h2>
    <p className="text-sm text-muted-foreground">{COPY.hint}</p>

    <FormField
      control={control}
      name="country"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {COPY.countryLabel}
            <span className="text-destructive ml-0.5">*</span>
          </FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={COPY.countryPlaceholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {APPLICATION_COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    {FIELDS.map(({ name, label, placeholder, required }) => (
      <FormField
        key={name}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <FormControl>
              <Input placeholder={placeholder} {...field} value={field.value as string} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))}
  </div>
);
