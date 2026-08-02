import { ArtPanel, SectionHead } from "@components/landing/primitives";
import { STEPS } from "@constants/landing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead
          title="Applicant to engineer, in six moves"
        />

        {/* A ledger, not a zigzag: one consistent row rhythm with the step
            index held in a fixed left gutter. */}
        <ol className="m-stagger mt-16 border-t border-rule">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="grid items-center gap-6 border-b border-rule py-8 md:grid-cols-[5rem_1fr_16rem] md:gap-12 md:py-12 lg:grid-cols-[7rem_1fr_22rem]"
              >
                <div className="flex items-center gap-4 md:block">
                  <span className="u-display u-nums block text-5xl text-ink/20 lg:text-6xl">
                    {step.number}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="h-4 w-4 text-quench-deep"
                      aria-hidden="true"
                    />
                    <h3 className="u-title text-[1.75rem] text-ink lg:text-[2.125rem]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-graphite">
                    {step.description}
                  </p>
                </div>

                {/* Each step carries its own tint, so the ledger runs through
                    six colours top to bottom instead of six identical plates. */}
                <ArtPanel
                  art={step.art}
                  aspect="aspect-[16/10]"
                  className="rounded-[3px]"
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
