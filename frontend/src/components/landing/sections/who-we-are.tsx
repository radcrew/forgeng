import { MissionScene } from "@components/illustrations";
import { Badge } from "@components/ui/badge";
import { VALUES } from "@constants/landing";

export function WhoWeAre() {
  return (
    <section id="who-we-are" className="px-6 py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg aspect-[4/5] order-2 md:order-1">
          <MissionScene />
          <div className="absolute bottom-5 left-5 right-5 bg-background/95 backdrop-blur rounded-xl p-4 shadow-md border border-border/60">
            <p className="text-[11px] font-bold tracking-widest text-primary">
              OUR MISSION
            </p>
            <p className="text-sm mt-2 leading-relaxed">
              Make the path from{" "}
              <span className="font-semibold">learning to code</span> to{" "}
              <span className="font-semibold">
                shipping production-quality work
              </span>{" "}
              repeatable, structured, and humane.
            </p>
          </div>
        </div>

        <div className="space-y-6 order-1 md:order-2">
          <Badge
            variant="outline"
            className="text-xs font-semibold tracking-wide"
          >
            Who We Are
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built by engineers, for engineers.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Forgeng started because we saw a gap: too many programs teach
            students to pass interviews instead of teaching them to ship.
            We&apos;re a small team of working software engineers who learned
            the craft the way it&apos;s actually learned — through mentorship
            from people who&apos;d built real systems. We rebuilt that
            experience into something anyone driven enough can access.
          </p>

          <div className="space-y-5 pt-2">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{value.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
