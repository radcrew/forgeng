import { type Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Textarea } from "@components/ui/textarea";
import {
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.background;

interface Props {
  control: Control<ApplicationFormValues>;
}

export const StepBackground = ({ control }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-xl font-semibold">{COPY.title}</h2>
    <FormField
      control={control}
      name="background"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.backgroundLabel}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={COPY.backgroundPlaceholder}
              className="min-h-[120px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="experience"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.experienceLabel}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={COPY.experiencePlaceholder}
              className="min-h-[100px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);
