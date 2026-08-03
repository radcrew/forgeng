import { Illustration } from "@components/illustrations";
import { SectionHead, TINT_PANEL } from "@components/landing/primitives";
import { LANDING_ART, VALUES } from "@constants/landing";
import { cn } from "@utils";

export function WhoWeAre() {
  return (
    <section
      id="who-we-are"
      className="border-b border-rule px-8 py-24 lg:px-12 lg:py-28"
    >
      {/* Heading sits inside the text column rather than spanning the section.
          Seven sections in a row opened with a full-width heading, which is
          what made the page read as one repeated beat. */}
      <div className="mx-auto grid max-w-[88rem] gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="m-enter">
          <SectionHead
            title={
              <>
                Built by engineers,
                <br />
                for engineers.
              </>
            }
          />

          {/* The one place the serif is allowed to speak at length. */}
          <p className="u-editorial mt-10 text-[1.75rem] leading-snug text-ink sm:text-[2.125rem]">
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

        <div className="m-enter lg:pt-24">
          {/* Caption stacks under the art instead of floating over it. The
              overlay needed the reserved padding to stay ahead of the caption's
              own height, and that balance broke as soon as the text rewrapped
              on a narrow column. Stacking cannot collide at any width. */}
          <div
            className={cn(
              "overflow-hidden rounded-[3px] lg:sticky lg:top-28",
              TINT_PANEL.violet,
            )}
          >
            <div className="relative aspect-[4/3]">
              <Illustration art={LANDING_ART.mission} className="p-7" />
            </div>
            {/* Label takes the deep cyan, not the brand cyan: on a light panel
                the brand value is 2.4:1. */}
            <div className="mx-7 border-t border-ink/10 pb-7 pt-5">
              <p className="u-tech text-[0.75rem] text-quench-deep">
                Our mission
              </p>
              <p className="u-editorial mt-3 text-xl leading-snug text-ink">
                Make the path from learning to code to shipping
                production-quality work repeatable, structured, and humane.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
