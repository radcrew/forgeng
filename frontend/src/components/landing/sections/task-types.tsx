import { TASK_TYPES } from "@constants/landing";

export function TaskTypes() {
  return (
    <section className="border-b border-rule bg-paper-sunk px-8 py-24 lg:px-12 lg:py-28">
      {/* A run-in strip: the heading sits beside its items rather than above
          them, so this reads as an aside between two full sections instead of
          repeating the same opening beat. */}
      <div className="mx-auto grid max-w-[88rem] gap-10 md:grid-cols-[16rem_1fr] md:gap-16">
        <h2 className="u-display u-tight self-start text-[2.125rem] text-ink">
          Four kinds
          <br />
          of work
        </h2>

        <ul className="m-stagger grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {TASK_TYPES.map((task) => {
            const Icon = task.icon;
            return (
              <li key={task.label} className="border-t-2 border-ink pt-4">
                <Icon className="h-4 w-4 text-quench-deep" aria-hidden="true" />
                <p className="u-title mt-3 text-2xl text-ink">{task.label}</p>
                <p className="mt-1.5 text-base leading-relaxed text-graphite">
                  {task.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
