import { STATS } from "@constants/landing";

export function Stats() {
  return (
    <section className="bg-ink text-paper">
      {/* Padding lives on the wrapper: the grid carries the hairline colour in
          its gaps, so any padding on it would tint the gutters too. */}
      <div className="mx-auto max-w-[88rem] px-8 lg:px-12">
        {/* Two columns on a phone leave only ~99px of content per cell at the
            desktop padding, which clipped "100%" — hence the smaller numeral
            and tighter inset below `sm`. */}
        <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-ink px-5 py-12 sm:px-8 sm:py-16">
              <div className="u-display u-tight u-nums text-5xl text-paper sm:text-6xl lg:text-7xl">
                {stat.value}
              </div>
              <div className="u-tech mt-4 text-[0.75rem] leading-relaxed text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
