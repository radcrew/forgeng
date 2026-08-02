import { Check, Minus } from "lucide-react";

import { cn } from "@utils";

interface VerdictProps {
  verdict: "approved" | "needs-work";
  /** Which ground it sits on. Picks the readable pair for that background. */
  tone?: "ink" | "paper";
  className?: string;
}

/**
 * The page's signature mark. Every submission in Forgeng ends in one of two
 * verdicts, so the same stamp that carries the colour system also carries the
 * product's central idea. Cyan is the quench — work that held. Ember is heat —
 * work still on the anvil.
 */
export function Verdict({
  verdict,
  tone = "paper",
  className,
}: VerdictProps) {
  const approved = verdict === "approved";
  const Icon = approved ? Check : Minus;
  const onInk = tone === "ink";
  return (
    <span
      className={cn(
        "u-stamp",
        approved
          ? onInk
            ? "text-quench"
            : "text-quench-deep"
          : onInk
            ? "text-ember"
            : "text-ember-deep",
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      {approved ? "Approved" : "Needs work"}
    </span>
  );
}
