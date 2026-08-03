import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { FAQS } from "@constants/landing";

export function Faq() {
  return (
    <section
      id="faq"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          {/* `self-start` matters: a stretched grid item fills the row, which
              leaves a sticky element no distance to travel. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="u-display u-tight text-[3rem] text-ink sm:text-6xl lg:text-[4.25rem]">
              Before you
              <br />
              apply
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-graphite">
              Not seeing yours? Email us — a person reads every message.
            </p>
            <Link
              href="/apply"
              className="u-tech mt-7 inline-block border-b-2 border-quench-deep pb-1 text-[0.75rem] text-ink transition-colors hover:text-quench-deep"
            >
              Start an application
            </Link>
          </div>

          <div>
            <Accordion
              type="single"
              collapsible
              className="w-full border-t border-rule"
            >
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${i}`}
                  className="border-b border-rule"
                >
                  <AccordionTrigger className="u-title py-6 text-xl text-ink hover:no-underline hover:text-quench-deep">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-3xl pb-7 text-base leading-relaxed text-graphite">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
