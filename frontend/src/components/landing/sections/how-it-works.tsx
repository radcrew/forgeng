import { Badge } from "@components/ui/badge";
import { STEPS } from "@constants/landing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-muted/20 px-6 py-24"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold tracking-wide"
          >
            Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            How Forgeng Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A structured, repeatable path from applicant to skilled engineer —
            with a mentor beside you every step.
          </p>
        </div>

        <div className="space-y-16">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;
            return (
              <div
                key={step.number}
                className={`grid md:grid-cols-2 gap-10 items-center ${
                  isEven ? "" : "md:[direction:rtl]"
                }`}
              >
                <div
                  className={`relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] ${
                    isEven ? "" : "md:[direction:ltr]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.photo}
                    alt={step.photoAlt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent mix-blend-multiply" />
                </div>

                <div
                  className={`space-y-4 ${
                    isEven ? "" : "md:[direction:ltr]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tracking-widest">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
