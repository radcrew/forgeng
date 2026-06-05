import { type Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@components/ui/form";
import {
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";
import { VideoRecorder } from "@components/common";
import { uploadVideoIntro } from "../../api";

const COPY = APPLICATION_WIZARD_COPY.steps.videoIntro;

interface Props {
  control: Control<ApplicationFormValues>;
  onVideoUploaded: (url: string) => void;
}

export const StepVideoIntro = ({ control, onVideoUploaded }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-xl font-semibold">{COPY.title}</h2>
    <p className="text-sm text-muted-foreground">{COPY.hint}</p>
    <FormField
      control={control}
      name="videoUrl"
      render={({ fieldState }) => (
        <FormItem>
          <FormControl>
            <VideoRecorder onUpload={uploadVideoIntro} onUploaded={onVideoUploaded} />
          </FormControl>
          {fieldState.error && (
            <FormMessage>{fieldState.error.message}</FormMessage>
          )}
        </FormItem>
      )}
    />
  </div>
);
