import { Footer, Header } from "@components/landing";

interface LegalPageProps {
  title: string;
  /** Human-readable effective date, e.g. "June 6, 2026". */
  lastUpdated: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}

export function LegalPage({
  title,
  lastUpdated,
  intro,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Header />

      <main className="flex-1 px-6 py-16">
        <article className="max-w-3xl mx-auto">
          <header className="space-y-3 mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated {lastUpdated}
            </p>
            {intro ? (
              <p className="text-muted-foreground leading-relaxed">{intro}</p>
            ) : null}
          </header>

          <div className="space-y-10">{children}</div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

interface LegalSectionProps {
  heading: string;
  children: React.ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed [&_a]:text-primary-strong [&_a]:font-medium [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
