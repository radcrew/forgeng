import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Verdict } from "@components/landing/primitives";
import { SAMPLE_FEEDBACK } from "@constants/landing";

const approved = SAMPLE_FEEDBACK.find((f) => f.verdict === "approved");

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20 lg:py-28">
        <div>
          <p className="u-rise u-tech text-[0.6875rem] text-steel">
            Applications open
          </p>

          <h1
            className="u-rise u-display u-tight mt-7 text-[3.25rem] sm:text-[4.5rem] lg:text-[5.25rem]"
            style={{ animationDelay: "60ms" }}
          >
            Engineers aren&apos;t
            <br />
            taught. They&apos;re
            <br />
            <span className="text-quench-deep">forged.</span>
          </h1>

          <p
            className="u-rise mt-8 max-w-xl text-lg leading-relaxed text-steel"
            style={{ animationDelay: "140ms" }}
          >
            A mentor-led apprenticeship. You ship real tasks, a working engineer
            reads every submission line by line, and you earn a stipend for the
            months you keep pace.
          </p>

          <div
            className="u-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "220ms" }}
          >
            <Link
              href="/sign-up"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-[3px] bg-ink px-7 text-sm font-semibold text-paper transition-colors hover:bg-quench hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Start an application
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-[3px] border-2 border-ink/15 px-7 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              See how it works
            </a>
          </div>

          <p
            className="u-rise u-tech mt-8 text-[0.625rem] leading-relaxed text-steel"
            style={{ animationDelay: "300ms" }}
          >
            Free to apply · Monthly stipend · No CS degree
          </p>
        </div>

        {/* The thesis: what actually comes back when you submit work. */}
        {approved && (
          <figure
            className="u-rise relative rounded-[3px] bg-ink text-paper"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <span className="u-tech text-[0.625rem] text-white/60">
                Sample review
              </span>
              <Verdict verdict="approved" tone="ink" />
            </div>

            <div className="px-6 py-7">
              <p className="u-tech text-[0.625rem] text-white/60">
                {approved.taskFooter?.replace("Task: ", "")}
              </p>
              <blockquote className="u-editorial mt-5 text-xl leading-relaxed text-paper sm:text-[1.375rem]">
                &ldquo;{approved.comment}&rdquo;
              </blockquote>
            </div>

            <figcaption className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
              <span className="u-tech text-[0.625rem] text-white/60">
                {approved.mentorName.replace("Mentor ", "")} ·{" "}
                {approved.mentorTitle}
              </span>
              <span className="u-tech text-[0.625rem] text-quench">
                Reviewed in 31h
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
