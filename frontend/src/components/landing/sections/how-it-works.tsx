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

                <div
                  className={cn(
                    "pl-16 md:pl-0",
                    onLeft ? "md:col-start-1" : "md:col-start-2",
                  )}
                >
                  {/* Art always hugs the spine: reversed on the left so the
                      tile sits against the centre on both sides. */}
                  {/* Stacked on mobile. Beside the copy there, the tile left
                      the text about 146px — three or four words a line. The
                      row only forms at md, where the two sides split. Exactly
                      one direction utility is emitted per item, since
                      flex-row and flex-row-reverse have equal specificity and
                      the winner would otherwise depend on stylesheet order. */}
                  <div
                    className={cn(
                      "flex flex-col gap-4 md:items-start md:gap-5",
                      onLeft
                        ? "md:flex-row-reverse md:text-right"
                        : "md:flex-row",
                    )}
                  >
                    <ArtPanel
                      art={step.art}
                      aspect="aspect-square"
                      className="w-24 shrink-0 rounded-[3px] sm:w-28"
                      artClassName="p-3"
                    />

                    {/* Capped measure: the half-column is 604px, and letting
                        the description use all of it pushed lines past 70
                        characters. At 28rem the text plus the tile fills the
                        side almost exactly. */}
                    <div className="min-w-0 max-w-md">
                      <div
                        className={cn(
                          "flex items-center gap-2.5",
                          onLeft && "md:justify-end",
                        )}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-quench-deep"
                          aria-hidden="true"
                        />
                        <h3 className="u-title text-2xl text-ink lg:text-[1.75rem]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-2.5 text-base leading-relaxed text-graphite">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
