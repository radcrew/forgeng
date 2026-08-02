import { Reveal } from "@components/landing/primitives";
import { STATS } from "@constants/landing";

export function Stats() {
  return (
    <section className="bg-ink text-paper">
      {/* Hairline grid drawn with gap-px over the band colour, so the numbers
          sit in a register rather than floating in centred columns. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 70} className="bg-ink">
            <div className="h-full px-6 py-12">
              <div className="u-display u-tight text-5xl text-paper lg:text-6xl">
                {stat.value}
              </div>
              <div className="u-tech mt-4 text-[0.625rem] leading-relaxed text-white/60">
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
