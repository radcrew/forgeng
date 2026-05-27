import { STATS } from "@constants/landing";

export function StatsSection() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-3xl md:text-4xl font-extrabold text-primary">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
