import { STATS } from "@constants/landing";

export function Stats() {
  return (
    <section className="bg-ink text-paper">
      {/* Padding lives on the wrapper: the grid carries the hairline colour in
          its gaps, so any padding on it would tint the gutters too. */}
      <div className="mx-auto max-w-[88rem] px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-ink px-8 py-16">
              <div className="u-display u-tight text-6xl text-paper lg:text-7xl">
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
