import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { FAQS } from "@constants/landing";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="border-t border-border bg-muted/30 px-6 py-24"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold tracking-wide"
          >
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Questions, Answered
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The things people most often want to know before applying.
            Don&apos;t see your question? Reach out — we read every email.
          </p>
        </div>

        <Card className="border-border/60">
          <CardContent className="px-6 py-2">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={faq.question} value={`item-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Still have questions?{" "}
            <Link
              href="/apply"
              className="text-primary font-semibold hover:underline"
            >
              Start an application
            </Link>{" "}
            — applying is free and we get back to every applicant.
          </p>
        </div>
      </div>
    </section>
  );
}
