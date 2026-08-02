import { Illustration } from "@components/illustrations";
import { Reveal, SectionHead } from "@components/landing/primitives";
import { STEPS } from "@constants/landing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-rule px-6 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            label="Process"
            title="Applicant to engineer, in six moves"
            lead="This one is a sequence. Each step depends on the one before it, and a mentor is beside you for all of them."
          />
        </Reveal>

        {/* A ledger, not a zigzag: one consistent row rhythm with the step
            index held in a fixed left gutter. */}
        <ol className="mt-16 border-t border-rule">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal
                key={step.number}
                delay={i * 50}
                as="li"
                className="group grid items-center gap-6 border-b border-rule py-8 md:grid-cols-[4rem_1fr_13rem] md:gap-10 md:py-10 lg:grid-cols-[5rem_1fr_16rem]"
              >
                  <div className="flex items-center gap-4 md:block">
                    <span className="u-display block text-4xl text-ink/20 transition-colors group-hover:text-quench-deep lg:text-5xl">
                      {step.number}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="h-4 w-4 text-quench-deep"
                        aria-hidden="true"
                      />
                      <h3 className="u-display text-2xl text-ink lg:text-[1.75rem]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-steel">
                      {step.description}
                    </p>
                  </div>

                  <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] border border-rule bg-white">
                    <Illustration art={step.art} className="p-4" />
                  </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
