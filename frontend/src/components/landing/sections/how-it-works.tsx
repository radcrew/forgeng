import { ArtPanel, SectionHead } from "@components/landing/primitives";
import { STEPS } from "@constants/landing";
import { cn } from "@utils";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead title="Applicant to engineer, in six moves" />

        {/* A centre timeline: one rule down the middle, steps alternating
            either side of it, each numbered on the line itself. The art is
            deliberately small — a tile, not a plate. Sizing it to the column
            was what made the previous pass look like six posters. */}
        <ol className="m-stagger relative mt-16 space-y-12 md:space-y-14">
          {/* The spine. Sits at the left edge on mobile, where there is no
              room to alternate, and moves to the centre from md up. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-5 w-px bg-rule md:left-1/2"
          />

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const onLeft = index % 2 === 0;

            return (
              <li
                key={step.number}
                className="relative md:grid md:grid-cols-2 md:gap-x-20"
              >
                {/* The number rides the spine, covering the rule behind it. */}
                <span className="absolute left-5 top-1 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-rule bg-paper md:left-1/2">
                  <span className="u-display u-nums text-sm text-steel">
                    {step.number}
                  </span>
                </span>

                {/* Copy and art take opposite halves, so each step reads
                    across the spine rather than stacking on one side of it.
                    Both are pinned to row 1: with only a column set, the grid
                    would drop the second one into a row of its own. */}
                <div
                  className={cn(
                    "pl-16 md:row-start-1 md:pl-0",
                    onLeft ? "md:col-start-1" : "md:col-start-2",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="h-4 w-4 shrink-0 text-quench-deep"
                      aria-hidden="true"
                    />
                    <h3 className="u-title text-2xl text-ink lg:text-[1.75rem]">
                      {step.title}
                    </h3>
                  </div>
                  {/* Capped measure: the half-column is 604px, and letting the
                      description use all of it pushed lines past 70
                      characters. */}
                  <p className="mt-2.5 max-w-md text-base leading-relaxed text-graphite">
                    {step.description}
                  </p>
                </div>

                {/* The tile hugs the spine from its own side, so the pair reads
                    as one row across the centre. On the left half that means
                    pushing it to the column's right edge. */}
                <div
                  className={cn(
                    "mt-5 pl-16 md:mt-0 md:row-start-1 md:pl-0",
                    onLeft
                      ? "md:col-start-2"
                      : "md:col-start-1 md:flex md:justify-end",
                  )}
                >
                  <ArtPanel
                    art={step.art}
                    aspect="aspect-square"
                    className="w-24 rounded-[3px] sm:w-28"
                    artClassName="p-3"
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
