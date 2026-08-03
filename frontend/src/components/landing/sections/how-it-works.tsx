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

        {/* Three-up process grid. The timeline variants all left a diagonal
            of dead space — an alternating layout empties the opposite half
            of every row by definition. Here every cell is filled by
            construction: the panel spans its column, the copy sits directly
            under it, and the step number is stamped over the panel itself so
            the sequence reads without a spine. */}
        <ol className="m-stagger mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="flex flex-col">
                <div className="relative">
                  <ArtPanel
                    art={step.art}
                    aspect="aspect-[16/10]"
                    className="rounded-[3px]"
                    artClassName="p-7 pt-9"
                  />
                  {/* The number is the panel's watermark: sequence stays
                      legible, and the corner it occupies stops reading as
                      spare room. */}
                  <span
                    aria-hidden="true"
                    className="u-display u-nums absolute right-5 top-3 text-6xl text-ink/15"
                  >
                    {step.number}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-2.5">
                  <Icon
                    className="h-4 w-4 shrink-0 text-quench-deep"
                    aria-hidden="true"
                  />
                  <h3 className="u-title text-2xl text-ink">{step.title}</h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-graphite">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
