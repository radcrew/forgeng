import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { ROLES } from "@constants/landing";

export function RolesSection() {
  return (
    <section id="roles" className="px-6 py-24 max-w-5xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <Badge
          variant="outline"
          className="text-xs font-semibold tracking-wide"
        >
          Who Is This For
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Find Your Place on the Platform
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Whether you&apos;re learning, teaching, or managing — there&apos;s a
          role designed for you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {ROLES.map((role) => (
          <Card
            key={role.role}
            className="border-border/60 flex flex-col hover:shadow-md transition-shadow overflow-hidden"
          >
            <CardContent className="p-0 flex flex-col flex-1">
              <div className="h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={role.photo}
                  alt={`${role.role} scenario`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-1 space-y-4">
                <Badge
                  className={`self-start text-xs font-semibold ${role.color} border-0`}
                >
                  {role.role}
                </Badge>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg">{role.headline}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={role.href}>
                    {role.cta} <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
