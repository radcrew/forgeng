import { Reveal } from "@components/landing/primitives";
import { STATS } from "@constants/landing";

export function Stats() {
  return (
    <section className="bg-ink text-paper">
      {/* Hairline grid drawn with gap-px over the band colour, so the numbers
          sit in a register rather than floating in centred columns. */}
      <div className="mx-auto grid max-w-[88rem] grid-cols-2 gap-px bg-white/10 px-8 md:grid-cols-4 lg:px-12">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 70} className="bg-ink">
            <div className="h-full px-8 py-16">
              <div className="u-display u-tight text-6xl text-paper lg:text-7xl">
                {stat.value}
              </div>
              <div className="u-tech mt-4 text-[0.75rem] leading-relaxed text-white/60">
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
