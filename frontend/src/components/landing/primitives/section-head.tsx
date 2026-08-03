import { cn } from "@utils";

interface SectionHeadProps {
  title: React.ReactNode;
  /** Set on dark bands so the rule reads against ink. */
  tone?: "ink" | "paper";
  className?: string;
}

/**
 * Every section header on the page. A ruled line, then the heading — no
 * eyebrow label. A label that names the section its own heading already names
 * is scaffolding, and holding a gutter open for one pushed every heading
 * 13rem to the right of the content it introduced.
 */
export function SectionHead({
  title,
  tone = "paper",
  className,
}: SectionHeadProps) {
  const onInk = tone === "ink";
  return (
    <div className={cn(className)}>
      <span
        aria-hidden="true"
        className={cn(
          "m-line block h-px w-full",
          onInk ? "bg-white/20" : "bg-ink/15",
        )}
      />
      <h2
        className={cn(
          "u-display u-tight mt-8 max-w-4xl text-[3rem] sm:text-6xl lg:text-[4.25rem]",
          onInk ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
    </div>
  );
}
