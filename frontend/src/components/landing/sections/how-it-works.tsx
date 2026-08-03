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

        {/* A centre timeline: copy on one side of the spine, its illustration
            on the other, alternating down the list. Both blocks are capped at
            the same width and pushed against the spine, so each step reads as
            one row through the centre and the leftover space collects on the
            outside as margin. Previously the art was a 112px tile adrift in a
            616px half, which left the empty side looking like a mistake. */}
        <ol className="m-stagger relative mt-16 space-y-16">
          {/* The spine. At the left edge on mobile, where there is no room to
              alternate, and centred from md up. */}
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
                {/* The number rides the spine, covering the rule behind it.
                    Centred against the row from md up rather than pinned to
                    its top, so it sits level with the pair it belongs to. */}
                <span className="absolute left-5 top-6 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-rule bg-paper md:left-1/2 md:top-1/2 md:-translate-y-1/2">
                  <span className="u-display u-nums text-sm text-steel">
                    {step.number}
                  </span>
                </span>

                {/* Copy and art take opposite halves. Both are pinned to row 1:
                    with only a column set, the grid would drop the second into
                    a row of its own. */}
                <div
                  className={cn(
                    "pl-16 md:row-start-1 md:self-center md:pl-0",
                    onLeft ? "md:col-start-1" : "md:col-start-2",
                  )}
                >
                  {/* Fills its half rather than sitting capped and centred
                      inside it, so there is no slack left to pool at the
                      edges. The type steps up with the width: at the full half
                      the old 16px description ran to about 77 characters a
                      line, which is past a comfortable measure. */}
                  <div>
                    <div className="flex items-center gap-3">
                      <Icon
                        className="h-5 w-5 shrink-0 text-quench-deep"
                        aria-hidden="true"
                      />
                      <h3 className="u-title text-[1.75rem] text-ink lg:text-[2.125rem]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-lg leading-relaxed text-graphite lg:text-xl">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-6 pl-16 md:mt-0 md:row-start-1 md:self-center md:pl-0",
                    onLeft ? "md:col-start-2" : "md:col-start-1",
                  )}
                >
                  {/* Spans the full half, like the copy opposite it. The 28rem
                      cap held the panel to roughly two thirds of the column,
                      which is what kept the illustration small. */}
                  <ArtPanel
                    art={step.art}
                    aspect="aspect-[2/1]"
                    className="w-full rounded-[3px]"
                    artClassName="p-6"
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
