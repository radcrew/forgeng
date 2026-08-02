import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CtaFieldArt } from "@components/illustrations";
import { Button } from "@components/ui/button";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden px-6 py-20 bg-primary text-primary-foreground text-center">
      {/* Inherits `text-primary-foreground` from the band via `stroke-current`. */}
      <div className="absolute inset-0 opacity-15">
        <CtaFieldArt />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Ready to become a real engineer?
        </h2>
        <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
          Applications take under 10 minutes. We review every one personally
          and get back to you within a week.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
          >
            <Link href="/sign-up">
              Apply Now — It&apos;s Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
          >
            <Link href="/sign-in">Already a member? Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
