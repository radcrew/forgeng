import { Illustration } from "@components/illustrations";
import { SectionHead } from "@components/landing/primitives";
import { LANDING_ART, VALUES } from "@constants/landing";

export function WhoWeAre() {
  return (
    <section
      id="who-we-are"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionHead
          title={
            <>
              Built by engineers,
              <br />
              for engineers.
            </>
          }
        />

        <div className="m-enter mt-16 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            {/* The one place the serif is allowed to speak at length. */}
            <p className="u-editorial text-[1.75rem] leading-snug text-ink sm:text-[2.125rem]">
              Too many programs teach students to pass interviews instead of
              teaching them to ship.
            </p>
            <p className="mt-7 text-base leading-relaxed text-graphite">
              We are a small team of working software engineers who learned the
              craft the way it is actually learned — through mentorship from
              people who had built real systems. We rebuilt that experience into
              something anyone driven enough can access.
            </p>

            <dl className="mt-10 divide-y divide-rule border-y border-rule">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="grid gap-2 py-5 sm:grid-cols-[1fr_1.4fr] sm:gap-8"
                >
                  <dt className="u-title text-xl text-ink">{value.title}</dt>
                  <dd className="text-base leading-relaxed text-graphite">
                    {value.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-ink">
              <Illustration
                art={LANDING_ART.mission}
                className="p-7 pb-32 opacity-95"
              />
              <div className="absolute inset-x-6 bottom-6 border-t border-white/15 pt-5">
                <p className="u-tech text-[0.75rem] text-quench">Our mission</p>
                <p className="u-editorial mt-3 text-xl leading-snug text-paper">
                  Make the path from learning to code to shipping
                  production-quality work repeatable, structured, and humane.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
