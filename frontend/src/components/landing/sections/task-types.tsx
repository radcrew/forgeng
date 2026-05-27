import { Card, CardContent } from "@components/ui/card";
import { TASK_TYPES } from "@constants/landing";

export function TaskTypes() {
  return (
    <section className="border-y border-border bg-muted/30 px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Four Types of Work
          </h2>
          <p className="text-muted-foreground mt-2">
            Every assignment is purpose-built to grow a specific skill.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TASK_TYPES.map((task) => {
            const Icon = task.icon;
            return (
              <Card
                key={task.label}
                className="text-center hover:shadow-md transition-shadow border-border/60"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{task.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
