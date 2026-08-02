import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Verdict } from "@components/landing/primitives";
import { SAMPLE_FEEDBACK } from "@constants/landing";

const approved = SAMPLE_FEEDBACK.find((f) => f.verdict === "approved");

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="u-hero mx-auto max-w-[88rem] px-8 py-12 lg:px-12 lg:py-16">
        <p className="u-rise u-tech text-[0.8125rem] text-steel">
          Applications open
        </p>

        {/* The headline runs the full container rather than sharing a column,
            which is what lets it sit at a confident size. */}
        <h1
          className="u-rise u-display u-tight u-hero-title mt-8 text-[3.25rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem]"
          style={{ animationDelay: "60ms" }}
        >
          Engineers aren&apos;t
          <br />
          taught. They&apos;re{" "}
          <span className="text-quench-deep">forged.</span>
        </h1>

        <div className="u-hero-split mt-8 grid gap-10 border-t border-rule pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p
              className="u-rise max-w-2xl text-xl leading-relaxed text-steel"
              style={{ animationDelay: "140ms" }}
            >
              A mentor-led apprenticeship. You ship real tasks, a working
              engineer reads every submission line by line, and you earn a
              stipend for the months you keep pace.
            </p>

            <div
              className="u-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                href="/sign-up"
                className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-[3px] bg-ink px-8 text-base font-semibold text-paper transition-colors hover:bg-quench hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Start an application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-14 items-center justify-center rounded-[3px] border-2 border-ink/15 px-8 text-base font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                See how it works
              </a>
            </div>

            <p
              className="u-rise u-tech mt-8 text-[0.75rem] leading-relaxed text-steel"
              style={{ animationDelay: "300ms" }}
            >
              Free to apply · Monthly stipend · No CS degree
            </p>
          </div>

          {/* The thesis: what actually comes back when you submit work. */}
          {approved && (
            <figure
              className="u-rise relative self-start rounded-[3px] bg-ink text-paper"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-8 py-4">
                <span className="u-tech text-[0.75rem] text-white/60">
                  Sample review
                </span>
                <Verdict verdict="approved" tone="ink" />
              </div>

              <div className="px-8 py-6">
                <p className="u-tech text-[0.75rem] text-white/60">
                  {approved.taskFooter?.replace("Task: ", "")}
                </p>
                <blockquote className="u-editorial u-hero-quote mt-5 text-2xl leading-relaxed text-paper sm:text-[1.625rem]">
                  &ldquo;{approved.comment}&rdquo;
                </blockquote>
              </div>

              <figcaption className="flex items-center justify-between gap-4 border-t border-white/10 px-8 py-4">
                <span className="u-tech text-[0.75rem] text-white/70">
                  {approved.mentorName.replace("Mentor ", "")} ·{" "}
                  {approved.mentorTitle}
                </span>
                <span className="u-tech text-[0.75rem] text-quench">
                  Reviewed in 31h
                </span>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
