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
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.socialProfiles;

interface Props {
  control: Control<ApplicationFormValues>;
}

type SocialField = {
  name: keyof ApplicationFormValues;
  label: string;
  placeholder: string;
};

const FIELDS: SocialField[] = [
  { name: "linkedin", label: COPY.linkedinLabel, placeholder: COPY.linkedinPlaceholder },
  { name: "github", label: COPY.githubLabel, placeholder: COPY.githubPlaceholder },
  { name: "twitter", label: COPY.twitterLabel, placeholder: COPY.twitterPlaceholder },
  { name: "facebook", label: COPY.facebookLabel, placeholder: COPY.facebookPlaceholder },
  { name: "portfolio", label: COPY.portfolioLabel, placeholder: COPY.portfolioPlaceholder },
];

export const StepSocialProfiles = ({ control }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-xl font-semibold">{COPY.title}</h2>
    <p className="text-sm text-muted-foreground">{COPY.hint}</p>
    {FIELDS.map(({ name, label, placeholder }) => (
      <FormField
        key={name}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
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
