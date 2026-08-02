import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Illustration } from "@components/illustrations";
import { Reveal, SectionHead } from "@components/landing/primitives";
import { ROLES } from "@constants/landing";

export function Roles() {
  return (
    <section id="roles" className="border-b border-rule px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            label="Find your place"
            title="Three ways in"
            lead="Whether you are applying, already building, or running a cohort, the platform is the same one."
          />
        </Reveal>

        <div className="mt-16 grid gap-px bg-rule md:grid-cols-3">
          {ROLES.map((role, i) => (
            <Reveal key={role.role} delay={i * 70} className="bg-paper">
              <article className="group flex h-full flex-col">
                <div className="relative aspect-[16/9] overflow-hidden border-b border-rule bg-white">
                  <Illustration art={role.art} className="p-5" />
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <p className="u-tech text-[0.625rem] text-quench-deep">
                    {role.role}
                  </p>
                  <h3 className="u-display mt-4 text-2xl text-ink">
                    {role.headline}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">
                    {role.description}
                  </p>
                  <Link
                    href={role.href}
                    className="u-tech mt-7 inline-flex items-center gap-2 text-[0.625rem] text-ink transition-colors hover:text-quench-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {role.cta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
