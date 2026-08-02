import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="border-t border-ink bg-ink text-paper">
      <div className="mx-auto max-w-[88rem] px-8 py-24 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="u-tech text-[0.8125rem] text-quench">
              Intake is open
            </p>
            <h2 className="u-display u-tight mt-6 text-[3.25rem] text-paper sm:text-7xl lg:text-[5rem]">
              Ten minutes to
              <br />
              apply. One week
              <br />
              to hear back.
            </h2>
          </div>

          <div className="lg:pb-3">
            <p className="text-lg leading-relaxed text-white/60">
              We read every application ourselves. No fee, no prerequisites, no
              automated screen deciding whether you are worth a look.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-[3px] bg-quench px-7 text-base font-semibold text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quench"
              >
                Start an application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-[3px] border-2 border-white/20 px-7 text-base font-semibold text-paper transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quench"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
