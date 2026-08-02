import { Check } from "lucide-react";

import { Reveal, SectionHead, Verdict } from "@components/landing/primitives";
import {
  FEEDBACK_BULLETS,
  FEEDBACK_TESTIMONIAL,
  SAMPLE_FEEDBACK,
} from "@constants/landing";

export function MentorFeedback() {
  return (
    <section className="border-b border-rule px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            label="Review"
            title={
              <>
                Two verdicts.
                <br />
                No hedging.
              </>
            }
            lead="Generic “looks good” is a missed opportunity. Every submission comes back with a written explanation and one of two outcomes."
          />
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal delay={80}>
            <ul className="border-t border-rule">
              {FEEDBACK_BULLETS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-4 border-b border-rule py-4 text-sm text-ink"
                >
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-quench-deep"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <figure className="mt-12 border-l-2 border-quench-deep pl-6">
              <blockquote className="u-editorial text-xl leading-snug text-ink sm:text-2xl">
                &ldquo;{FEEDBACK_TESTIMONIAL.quote}&rdquo;
              </blockquote>
              <figcaption className="u-tech mt-5 text-[0.625rem] text-steel">
                {FEEDBACK_TESTIMONIAL.attribution.replace("— ", "")}
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={160}>
            <div className="space-y-5">
              {SAMPLE_FEEDBACK.map((sample) => {
                const approved = sample.verdict === "approved";
                return (
                  <article
                    key={sample.mentorName}
                    className={`rounded-[3px] border-l-2 bg-white ${
                      approved ? "border-l-quench-deep" : "border-l-ember-deep"
                    } border-y border-r border-rule`}
                  >
                    <header className="flex items-center justify-between gap-4 border-b border-rule px-6 py-4">
                      <div>
                        <p className="u-display text-sm text-ink">
                          {sample.mentorName.replace("Mentor ", "")}
                        </p>
                        <p className="u-tech mt-1 text-[0.5625rem] text-steel">
                          {sample.mentorTitle}
                        </p>
                      </div>
                      <Verdict verdict={sample.verdict} />
                    </header>

                    <div className="px-6 py-6">
                      <p className="u-editorial text-base leading-relaxed text-ink">
                        &ldquo;{sample.comment}&rdquo;
                      </p>
                      {sample.taskFooter && (
                        <p className="u-tech mt-5 text-[0.5625rem] text-steel">
                          {sample.taskFooter}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
