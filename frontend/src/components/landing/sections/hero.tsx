import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Verdict } from "@components/landing/primitives";
import { SAMPLE_FEEDBACK } from "@constants/landing";

const approved = SAMPLE_FEEDBACK.find((f) => f.verdict === "approved");

const ASSURANCES = ["Free to apply", "Monthly stipend", "No CS degree"];

export function Hero() {
  return (
    // Exactly one screen less the sticky header, so the ink band below starts
    // at the fold instead of showing a strip of itself above it.
    <section className="relative flex min-h-[calc(100svh-var(--header-h))] flex-col justify-center overflow-hidden border-b border-rule">
      <span aria-hidden="true" className="u-hero-field" />
      <span aria-hidden="true" className="u-hero-glow" />

      <div className="u-hero relative mx-auto w-full max-w-[88rem] px-8 py-12 lg:px-12 lg:py-16">
        {/* Status pill rather than a bare eyebrow line: the live dot gives
            the page a pulse the moment it loads. */}
        <p className="u-rise inline-flex items-center gap-2.5 rounded-full border border-rule bg-white/70 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-quench opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-quench-deep" />
          </span>
          <span className="u-tech text-[0.75rem] text-graphite">
            Applications open
          </span>
        </p>

        {/* The headline runs the full container rather than sharing a column,
            which is what lets it sit at a confident size. The break is placed
            by hand so the sentence lands whole on line one; `u-hero-title`
            sizes it to keep that true down to 320px. */}
        <h1
          className="u-rise u-display u-tight u-hero-title mt-8"
          style={{ animationDelay: "60ms" }}
        >
          Engineers aren&apos;t taught.
          {/* The explicit space matters: below 40rem the break is hidden, and
              JSX strips the whitespace around an element boundary, so without
              it the two sentences run together as "taught.They're". At the
              start of a line the space collapses, so the desktop break is
              unaffected. */}
          <br />{" "}
          {/* Quench word, ember full stop: the two verdict hues in four
              letters and a dot. */}
          They&apos;re{" "}
          <span className="text-quench-deep">
            forged<span className="text-ember-deep">.</span>
          </span>
        </h1>

        <div className="u-hero-split mt-8 grid gap-10 border-t border-rule pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p
              className="u-rise max-w-2xl text-xl leading-relaxed text-graphite"
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
                className="group m-press inline-flex h-14 items-center justify-center gap-2.5 rounded-[3px] bg-ink px-8 text-base font-semibold text-paper transition-colors hover:bg-quench hover:text-ink"
              >
                Start an application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="m-press inline-flex h-14 items-center justify-center rounded-[3px] border-2 border-ink/15 px-8 text-base font-semibold text-ink transition-colors hover:border-ink"
              >
                See how it works
              </a>
            </div>

            {/* Checks, not a dotted line: the same three assurances read as
                terms that hold rather than fine print. */}
            <ul
              className="u-rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-3"
              style={{ animationDelay: "300ms" }}
            >
              {ASSURANCES.map((item) => (
                <li
                  key={item}
                  className="u-tech flex items-center gap-2 text-[0.75rem] text-steel"
                >
                  <Check
                    className="h-3.5 w-3.5 text-quench-deep"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* The thesis as a product window: the review that comes back when
              you submit work, framed like the app that sends it. Light, on a
              tinted mat — the ink slab it replaces was the last dark holdout
              after the rest of the page moved onto the bright tint system. */}
          {approved && (
            <div
              className="u-rise relative self-start"
              style={{ animationDelay: "180ms" }}
            >
              {/* The mat: a rotated wash of the brand tint behind the window,
                  same family as the illustration panels, so the hero speaks
                  the page's colour language. */}
              <span
                aria-hidden="true"
                className="absolute -inset-2 rotate-[-1.4deg] rounded-lg bg-tint-cyan"
              />

              <figure className="relative flex flex-col overflow-hidden rounded-lg border border-rule bg-white shadow-[0_32px_64px_-36px_rgba(11,12,14,0.35)]">
                {/* Window chrome: enough to read as software, not enough to
                    read as a screenshot. */}
                <div className="flex items-center justify-between gap-4 border-b border-rule bg-paper-sunk px-5 py-3.5">
                  <span aria-hidden="true" className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
                  </span>
                  <span className="u-tech text-[0.7rem] text-steel">
                    Submission review
                  </span>
                </div>

                <div className="px-7 py-6">
                  <p className="u-tech text-[0.75rem] text-quench-deep">
                    {approved.taskFooter?.replace("Task: ", "")}
                  </p>
                  <blockquote className="u-editorial u-hero-quote mt-4 text-2xl leading-relaxed text-ink sm:text-[1.625rem]">
                    &ldquo;{approved.comment}&rdquo;
                  </blockquote>
                </div>

                <figcaption className="flex items-center justify-between gap-4 border-t border-rule px-7 py-4">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-quench-deep/10 text-sm font-semibold text-quench-deep"
                    >
                      {approved.mentorInitial}
                    </span>
                    <span className="u-tech text-[0.75rem] text-steel">
                      {approved.mentorName.replace("Mentor ", "")} ·{" "}
                      {approved.mentorTitle}
                    </span>
                  </span>
                  {/* Lands last in the hero sequence: the review arrives, then
                      the verdict is stamped on it. */}
                  <Verdict verdict="approved" className="m-stamp" />
                </figcaption>
              </figure>

              {/* Turnaround chip breaking the window's edge — the one number
                  that answers "and then I wait how long?" Ink, so it carries
                  against the light card. */}
              <p className="absolute -left-3 top-16 inline-flex items-center gap-2 rounded-[3px] bg-ink px-3.5 py-2.5 shadow-[0_12px_24px_-12px_rgba(11,12,14,0.5)]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-quench"
                />
                <span className="u-tech text-[0.7rem] text-paper">
                  Reviewed in 31h
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
