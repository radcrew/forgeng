import { Reveal, SectionHead } from "@components/landing/primitives";
import { DAILY_RHYTHM } from "@constants/landing";

export function DailyRhythm() {
  return (
    <section
      id="life-in-program"
      className="border-b border-rule bg-ink px-6 py-24 text-paper lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            tone="ink"
            label="A typical week"
            title="What the work actually looks like"
            lead="These repeat. They are the texture of the program, not a sequence you graduate out of."
          />
        </Reveal>

        <ul className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {DAILY_RHYTHM.map((item, i) => (
            <Reveal
              key={item.label}
              delay={i * 60}
              as="li"
              className="flex h-full flex-col gap-4 bg-ink p-6 lg:p-7"
            >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-quench"
                />
                <p className="u-display text-base text-paper">{item.label}</p>
                <p className="text-sm leading-relaxed text-white/55">
                  {item.description}
                </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
