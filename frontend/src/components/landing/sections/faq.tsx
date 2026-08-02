import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { Reveal } from "@components/landing/primitives";
import { FAQS } from "@constants/landing";

export function Faq() {
  return (
    <section id="faq" className="border-b border-rule px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="u-tech text-[0.6875rem] text-steel">Questions</p>
              <h2 className="u-display u-tight mt-5 text-[2.5rem] text-ink sm:text-5xl">
                Before you
                <br />
                apply
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-steel">
                Not seeing yours? Email us — a person reads every message.
              </p>
              <Link
                href="/apply"
                className="u-tech mt-7 inline-block border-b-2 border-quench-deep pb-1 text-[0.625rem] text-ink transition-colors hover:text-quench-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Start an application
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <Accordion type="single" collapsible className="w-full border-t border-rule">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${i}`}
                  className="border-b border-rule"
                >
                  <AccordionTrigger className="u-display py-6 text-lg text-ink hover:no-underline hover:text-quench-deep">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-7 text-sm leading-relaxed text-steel">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
