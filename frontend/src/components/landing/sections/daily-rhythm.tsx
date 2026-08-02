import { SectionHead } from "@components/landing/primitives";
import { DAILY_RHYTHM } from "@constants/landing";

export function DailyRhythm() {
  return (
    <section
      id="life-in-program"
      className="border-b border-rule bg-ink px-8 py-24 text-paper lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead
          tone="ink"
          label="The week"
          title="What the work actually looks like"
        />

        <ul className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {DAILY_RHYTHM.map((item) => (
            <li
              key={item.label}
              className="flex h-full flex-col gap-4 bg-ink p-8"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-quench"
              />
              <p className="u-display text-lg text-paper">{item.label}</p>
              <p className="text-base leading-relaxed text-white/55">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
