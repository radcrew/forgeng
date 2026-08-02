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
    <div className={cn("grid gap-x-12 gap-y-6 md:grid-cols-[13rem_1fr]", className)}>
      <div className="flex items-center gap-3 pt-2 md:pt-3">
        <span
          aria-hidden="true"
          className={cn(
            "h-px w-6 shrink-0 md:w-full md:max-w-[2.5rem]",
            onInk ? "bg-white/25" : "bg-ink/20",
          )}
        />
        <span
          className={cn(
            "u-tech whitespace-nowrap text-[0.8125rem]",
            onInk ? "text-white/55" : "text-steel",
          )}
        >
          {label}
        </span>
      </div>

      <div className="max-w-3xl">
        <h2
          className={cn(
            "u-display u-tight text-[3rem] sm:text-6xl lg:text-[4.25rem]",
            onInk ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "mt-5 text-lg leading-relaxed sm:text-xl",
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
