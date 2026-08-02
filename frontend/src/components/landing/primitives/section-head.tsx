import { cn } from "@utils";

interface SectionHeadProps {
  /** Left-gutter label. Short — it names the section, it does not sell it. */
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Set on dark bands so the rule and label read against ink. */
  tone?: "ink" | "paper";
  className?: string;
}

/**
 * Every section header on the page. The label sits in a left gutter against a
 * rule rather than a centered pill, so the headings stack into a single
 * left-hand spine down the page instead of six identical centered blocks.
 */
export function SectionHead({
  label,
  title,
  lead,
  tone = "paper",
  className,
}: SectionHeadProps) {
  const onInk = tone === "ink";
  return (
    <div className={cn("grid gap-x-10 gap-y-5 md:grid-cols-[10rem_1fr]", className)}>
      <div className="flex items-center gap-3 pt-2 md:pt-3">
        <span
          aria-hidden="true"
          className={cn(
            "h-px w-6 shrink-0 md:w-full md:max-w-[3.5rem]",
            onInk ? "bg-white/25" : "bg-ink/20",
          )}
        />
        <span
          className={cn(
            "u-tech text-[0.6875rem]",
            onInk ? "text-white/55" : "text-steel",
          )}
        >
          {label}
        </span>
      </div>

      <div className="max-w-2xl">
        <h2
          className={cn(
            "u-display u-tight text-[2.5rem] sm:text-5xl lg:text-[3.5rem]",
            onInk ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "mt-5 text-base leading-relaxed sm:text-lg",
              onInk ? "text-white/65" : "text-steel",
            )}
          >
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}
