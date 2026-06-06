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
  APPLICATION_TEXT_MAX_LENGTH,
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.motivation;

interface Props {
  control: Control<ApplicationFormValues>;
}

export const StepMotivation = ({ control }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-xl font-semibold">{COPY.title}</h2>
    <FormField
      control={control}
      name="motivation"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{COPY.motivationLabel}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={COPY.motivationPlaceholder}
              className="min-h-[150px]"
              maxLength={APPLICATION_TEXT_MAX_LENGTH}
              {...field}
            />
          </FormControl>
          <div className="flex items-center justify-between">
            <FormMessage />
            <span className="ml-auto text-xs text-muted-foreground">
              {field.value?.length ?? 0}/{APPLICATION_TEXT_MAX_LENGTH}
            </span>
          </div>
        </FormItem>
      )}
    />
  </div>
);
