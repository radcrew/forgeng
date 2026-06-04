import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { APPLICATION_WIZARD_COPY } from "@constants/applications";

const COPY = APPLICATION_WIZARD_COPY.steps.basicInfo;

interface Props {
  user: { name?: string | null; email?: string } | null | undefined;
}

export const StepBasicInfo = ({ user }: Props) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-xl font-semibold">{COPY.title}</h2>
    <p className="text-sm text-muted-foreground">{COPY.accountHint}</p>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>{COPY.nameLabel}</Label>
        <Input value={user?.name ?? "—"} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label>{COPY.emailLabel}</Label>
        <Input value={user?.email ?? "—"} disabled readOnly />
      </div>
    </div>
  </div>
);
