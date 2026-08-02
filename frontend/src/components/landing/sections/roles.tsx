import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Illustration } from "@components/illustrations";
import { SectionHead } from "@components/landing/primitives";
import { ROLES } from "@constants/landing";

export function Roles() {
  return (
    <section
      id="roles"
      className="border-b border-rule bg-paper-sunk px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead title="Three ways in" />

        <div className="m-stagger mt-16 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {ROLES.map((role) => (
            // The whole card is the target, so the hover state describes
            // something you can actually click. The visible cue stays a span:
            // a link inside a link is invalid.
            <Link
              key={role.role}
              href={role.href}
              className="group m-press flex flex-col bg-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                <Illustration
                  art={role.art}
                  className="p-6 opacity-95 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              </div>

              <div className="flex flex-1 flex-col p-8">
                <p className="u-tech text-[0.75rem] text-quench-deep">
                  {role.role}
                </p>
                <h3 className="u-title mt-4 text-[1.75rem] text-ink">
                  {role.headline}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-graphite">
                  {role.description}
                </p>
                <span className="u-tech mt-7 inline-flex items-center gap-2 text-[0.75rem] text-ink transition-colors group-hover:text-quench-deep">
                  {role.cta}
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
