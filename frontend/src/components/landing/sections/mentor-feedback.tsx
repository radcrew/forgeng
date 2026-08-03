import { Check } from "lucide-react";

import { SectionHead, Verdict } from "@components/landing/primitives";
import {
  FEEDBACK_BULLETS,
  FEEDBACK_TESTIMONIAL,
  SAMPLE_FEEDBACK,
} from "@constants/landing";

export function MentorFeedback() {
  return (
    <section className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[88rem]">
        <SectionHead
          title={
            <>
              Two verdicts.
              <br />
              No hedging.
            </>
          }
        />

        {/* The pair is the argument. Side by side they read as the two
            outcomes the heading promises; stacked in a narrow column they
            were just two quotes. Sized to their content rather than stretched
            to match: only one sample carries a task line, so equal heights
            left a void under the shorter card. Their tops align, which is the
            edge that matters for a comparison. */}
        <div className="m-stagger mt-16 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {SAMPLE_FEEDBACK.map((sample) => {
            const approved = sample.verdict === "approved";
            return (
              <article
                key={sample.mentorName}
                className={`rounded-[3px] border-y border-r border-l-2 border-rule bg-white ${
                  approved ? "border-l-quench-deep" : "border-l-ember-deep"
                }`}
              >
                <header className="flex items-center justify-between gap-4 border-b border-rule px-7 py-5">
                  <div>
                    <p className="u-title text-base text-ink">
                      {sample.mentorName.replace("Mentor ", "")}
                    </p>
                    <p className="u-tech mt-1 text-[0.75rem] text-steel">
                      {sample.mentorTitle}
                    </p>
                  </div>
                  <Verdict verdict={sample.verdict} />
                </header>

                <div className="px-7 py-7">
                  <p className="u-editorial text-lg leading-relaxed text-ink">
                    &ldquo;{sample.comment}&rdquo;
                  </p>
                  {sample.taskFooter && (
                    <p className="u-tech mt-6 text-[0.75rem] text-steel">
                      {sample.taskFooter}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* What holds for every submission, not just these two. A rule-bound
            strip rather than a bulleted column: these are terms, and reading
            across suits them better than reading down. */}
        <ul className="mt-16 grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {FEEDBACK_BULLETS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 border-b border-rule py-5 pr-6 text-base text-ink lg:border-r lg:last:border-r-0"
            >
              <Check
                className="mt-1 h-3.5 w-3.5 shrink-0 text-quench-deep"
                strokeWidth={3}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>

        {/* A different voice from everything above it — a graduate, not the
            product — so it gets its own width and centre rather than being
            stacked under the terms wearing the same left rule as the cards. */}
        <figure className="mx-auto mt-24 max-w-4xl text-center">
          <blockquote className="u-editorial text-[1.75rem] leading-snug text-ink sm:text-[2.125rem]">
            &ldquo;{FEEDBACK_TESTIMONIAL.quote}&rdquo;
          </blockquote>
          <figcaption className="u-tech mt-8 text-[0.75rem] text-steel">
            {FEEDBACK_TESTIMONIAL.attribution.replace("— ", "")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
