import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { PHOTOS } from "@constants/landing";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:py-24">
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide"
          >
            Applications Open
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Master Software{" "}
            <span className="text-primary">Engineering</span> the Right Way.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A rigorous, mentor-led apprenticeship. Apply, join a cohort,
            complete real projects, get expert code review, and build the
            skills that actually get you hired.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
            >
              <Link href="/sign-up">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
            >
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free to apply · No CS degree required · Real mentor feedback
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTOS.hero}
            alt="Two professionals collaborating on code in a modern office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-background/90 backdrop-blur rounded-xl p-3 flex items-center gap-3 shadow">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                S
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Mentor Sarah reviewed your submission
                </p>
                <p className="text-xs text-muted-foreground">
                  Binary Search Tree —{" "}
                  <span className="text-primary font-medium">Approved ✓</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
