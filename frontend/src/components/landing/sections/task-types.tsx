import { SectionHead } from "@components/landing/primitives";
import { TASK_TYPES } from "@constants/landing";

export function TaskTypes() {
  return (
    <section className="border-b border-rule bg-paper-sunk px-8 py-24 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[88rem]">
        {/* This was the only section whose heading was a gutter label rather
            than a heading, which is why it sat at a different weight. */}
        <SectionHead title="Four kinds of work" />

        <ul className="m-enter mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
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
