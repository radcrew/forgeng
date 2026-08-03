import { ArtPanel, SectionHead } from "@components/landing/primitives";
import { STEPS } from "@constants/landing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead title="Applicant to engineer, in six moves" />

        {/* Two up rather than a six-row ledger. As one row per step, the row
            height was set by the illustration while the copy needed half of
            it, and the description sat in a column 217px wider than its own
            measure — waste in both directions. Deliberately flat: no card, no
            border, no ground, so it stays distinct from the role cards below,
            which are the section that does use cards. */}
        <ol className="m-stagger mt-16 grid gap-x-16 gap-y-16 md:grid-cols-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="flex flex-col">
                <div className="flex items-center gap-5">
                  <span className="u-display u-nums text-4xl text-ink/25">
                    {step.number}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-rule"
                  />
                </div>

                {/* Art beside the copy at a fixed width, not a plate spanning
                    the column. Spanning it made the illustration scale with
                    the column and hand back all the height the two-up layout
                    had just saved. At 15rem the row is sized by the text
                    instead, and the copy lands near a 50-character measure. */}
                {/* The art only moves beside the copy at lg. At md the grid is
                    already two up, which leaves 320px columns — a fixed 240px
                    of art there left the text below its longest word and blew
                    72px out of the viewport. It also narrows at lg, where the
                    columns are 448px, and takes full width at xl. */}
                <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:gap-6">
                  <ArtPanel
                    art={step.art}
                    aspect="aspect-[16/10]"
                    className="rounded-[3px] lg:w-48 lg:shrink-0 xl:w-60"
                    artClassName="p-4"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="h-4 w-4 shrink-0 text-quench-deep"
                        aria-hidden="true"
                      />
                      <h3 className="u-title text-[1.75rem] text-ink">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-base leading-relaxed text-graphite">
                      {step.description}
                    </p>
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
