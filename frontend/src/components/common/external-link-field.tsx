import { ExternalLink } from "lucide-react";

import { isSafeHref } from "@utils";

import { SectionTitle } from "./detail-display";

export type ExternalLinkFieldProps = {
  href: string;
  title?: string;
};

export const ExternalLinkField = ({
  href,
  title = "Repository",
}: ExternalLinkFieldProps) => (
  <div>
    <SectionTitle>{title}</SectionTitle>
    {isSafeHref(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 text-primary hover:underline text-sm"
      >
        <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" />
        <span className="min-w-0 break-all">{href}</span>
      </a>
    ) : (
      <p className="text-sm break-all">{href}</p>
    )}
  </div>
);
