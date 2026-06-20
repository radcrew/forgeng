import { ProseBlock, SectionTitle } from "@components/common";
import { isSafeHref } from "@utils";
import { countryLabel } from "@constants/shared/countries";
import type { Application } from "../types";
import { CopyButton } from "./copy-button";

const SOCIAL_LINKS = [
  { key: "linkedin" as const, label: "LinkedIn" },
  { key: "github" as const, label: "GitHub" },
  { key: "twitter" as const, label: "Twitter / X" },
  { key: "facebook" as const, label: "Facebook" },
  { key: "portfolio" as const, label: "Portfolio" },
] as const;

export type ApplicationContentProps = { application: Application };

export function ApplicationContent({ application }: ApplicationContentProps) {
  const hasSocialLinks = SOCIAL_LINKS.some(({ key }) => !!application[key]);
  const hasContact =
    application.telegram || application.whatsapp || application.country;

  return (
    <div className="space-y-5">
      {application.motivation && (
        <div>
          <SectionTitle className="mb-2">Motivation</SectionTitle>
          <ProseBlock className="bg-transparent p-0">
            {application.motivation}
          </ProseBlock>
        </div>
      )}
      {application.background && (
        <div>
          <SectionTitle className="mb-2">Background</SectionTitle>
          <ProseBlock className="bg-transparent p-0">
            {application.background}
          </ProseBlock>
        </div>
      )}
      {application.experience && (
        <div>
          <SectionTitle className="mb-2">Experience</SectionTitle>
          <ProseBlock className="bg-transparent p-0">
            {application.experience}
          </ProseBlock>
        </div>
      )}
      {hasSocialLinks && (
        <div>
          <SectionTitle className="mb-2">Social Profiles</SectionTitle>
          <div className="space-y-2 text-sm">
            {SOCIAL_LINKS.filter(({ key }) => !!application[key]).map(
              ({ key, label }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{label}</span>
                  {isSafeHref(application[key]!) ? (
                    <a
                      href={application[key]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs break-all hover:underline"
                    >
                      {application[key]}
                    </a>
                  ) : (
                    <span className="text-xs break-all">{application[key]}</span>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}
      {hasContact && (
        <div>
          <SectionTitle className="mb-2">Contact</SectionTitle>
          <div className="space-y-2 text-sm">
            {application.telegram && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Telegram</span>
                <span className="font-mono text-xs flex items-center">
                  {application.telegram}
                  <CopyButton text={application.telegram} />
                </span>
              </div>
            )}
            {application.whatsapp && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">WhatsApp</span>
                <span className="font-mono text-xs flex items-center">
                  {application.whatsapp}
                  <CopyButton text={application.whatsapp} />
                </span>
              </div>
            )}
            {application.country && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Country</span>
                <span className="text-xs">
                  {countryLabel(application.country)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
