import { Illustration } from "@components/illustrations";
import { Reveal, SectionHead } from "@components/landing/primitives";
import { LANDING_ART, VALUES } from "@constants/landing";

export function WhoWeAre() {
  return (
    <section id="who-we-are" className="border-b border-rule px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            label="Who we are"
            title={
              <>
                Built by engineers,
                <br />
                for engineers.
              </>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal delay={80}>
            {/* The one place the serif is allowed to speak at length. */}
            <p className="u-editorial text-2xl leading-snug text-ink sm:text-[1.75rem]">
              Too many programs teach students to pass interviews instead of
              teaching them to ship.
            </p>
            <p className="mt-7 text-base leading-relaxed text-steel">
              We are a small team of working software engineers who learned the
              craft the way it is actually learned — through mentorship from
              people who had built real systems. We rebuilt that experience into
              something anyone driven enough can access.
            </p>

            <dl className="mt-12 divide-y divide-rule border-y border-rule">
              {VALUES.map((value) => (
                <div key={value.title} className="grid gap-2 py-6 sm:grid-cols-[1fr_1.4fr] sm:gap-8">
                  <dt className="u-display text-lg text-ink">{value.title}</dt>
                  <dd className="text-sm leading-relaxed text-steel">
                    {value.description}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={160}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-ink">
              <Illustration
                art={LANDING_ART.mission}
                className="p-8 pb-36 opacity-95"
              />
              <div className="absolute inset-x-6 bottom-6 border-t border-white/15 pt-5">
                <p className="u-tech text-[0.625rem] text-quench">Our mission</p>
                <p className="u-editorial mt-3 text-lg leading-snug text-paper">
                  Make the path from learning to code to shipping
                  production-quality work repeatable, structured, and humane.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
