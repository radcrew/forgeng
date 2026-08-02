import { Reveal } from "@components/landing/primitives";
import { TASK_TYPES } from "@constants/landing";

export function TaskTypes() {
  return (
    <section className="border-b border-rule px-8 py-28 lg:px-12">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-[14rem_1fr] md:items-baseline">
          <p className="u-tech text-[0.8125rem] text-steel">Four kinds of work</p>

          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {TASK_TYPES.map((task, i) => {
              const Icon = task.icon;
              return (
                <Reveal
                  key={task.label}
                  delay={i * 60}
                  as="li"
                  className="border-t-2 border-ink pt-4"
                >
                    <Icon
                      className="h-4 w-4 text-quench-deep"
                      aria-hidden="true"
                    />
                    <p className="u-display mt-3 text-2xl text-ink">
                      {task.label}
                    </p>
                    <p className="mt-1.5 text-base leading-relaxed text-steel">
                      {task.description}
                    </p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
