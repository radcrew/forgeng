import { Badge } from "@components/ui/badge";
import { DAILY_RHYTHM } from "@constants/landing";

export function DailyRhythm() {
  return (
    <section id="life-in-program" className="border-t border-border px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold tracking-wide"
          >
            Life in the Program
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            What the Day-to-Day Looks Like
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Mentoring sessions, code reviews, cohort syncs, pair programming —
            this is what real learning looks like.
          </p>
        </div>

        <ul className="relative grid gap-10 md:grid-cols-5 md:gap-6">
          {/* Runs behind the markers to tie the week together. Hidden on the
              stacked mobile layout, where there is no shared baseline. */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-0 right-0 top-2 h-px bg-border"
          />

          {DAILY_RHYTHM.map((item) => (
            <li key={item.label} className="relative space-y-3">
              <span
                aria-hidden="true"
                className="relative z-10 block h-4 w-4 rounded-full border-2 border-primary bg-background"
              />
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
