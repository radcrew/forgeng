import { Reveal, SectionHead } from "@components/landing/primitives";
import { FEATURES } from "@constants/landing";

export function Features() {
  return (
    <section id="features" className="border-b border-rule px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            label="What you get"
            title="The feedback loop, not the lecture hall"
            lead="Everything here exists to shorten the distance between writing something and finding out whether it was any good."
          />
        </Reveal>

        <ul className="mt-16 grid border-t border-rule md:grid-cols-2 md:gap-x-16">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal
                key={feature.title}
                delay={(i % 2) * 60}
                as="li"
                className="flex h-full gap-5 border-b border-rule py-7"
              >
                  <Icon
                    className="mt-1 h-4 w-4 shrink-0 text-quench-deep"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="u-display text-lg text-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-steel">
                      {feature.description}
                    </p>
                  </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
