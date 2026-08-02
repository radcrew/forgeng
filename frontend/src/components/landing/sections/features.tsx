import { SectionHead } from "@components/landing/primitives";
import { FEATURES } from "@constants/landing";

export function Features() {
  return (
    <section
      id="features"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead
          title="The feedback loop, not the lecture hall"
        />

        <ul className="m-enter mt-16 grid border-t border-rule md:grid-cols-2 md:gap-x-16">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="flex h-full gap-5 border-b border-rule py-7"
              >
                <Icon
                  className="mt-1 h-4 w-4 shrink-0 text-quench-deep"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="u-display text-xl text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-steel">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
