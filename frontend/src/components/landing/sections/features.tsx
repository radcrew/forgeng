import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { FEATURES } from "@constants/landing";

export function Features() {
  return (
    <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <Badge
          variant="outline"
          className="text-xs font-semibold tracking-wide"
        >
          Features
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Everything You Need to Grow
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Built to give apprentices the same feedback loop that top engineers
          enjoy at elite companies.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="border-border/60 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
