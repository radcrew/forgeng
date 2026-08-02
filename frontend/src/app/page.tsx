import {
  CtaBanner,
  DailyRhythm,
  Faq,
  Features,
  Footer,
  Header,
  Hero,
  HowItWorks,
  MentorFeedback,
  Roles,
  Stats,
  TaskTypes,
  WhoWeAre,
} from "@components/landing";

/**
 * `landing` scopes the marketing type and palette so the signed-in app keeps
 * its own system. The ink bands (Stats, DailyRhythm, CtaBanner) are spaced
 * apart deliberately so the page alternates weight rather than clustering it.
 */
const Page = () => (
  <div className="landing flex min-h-screen flex-col">
    <Header />

    <main className="flex-1">
      <Hero />
      <Stats />
      <WhoWeAre />
      <TaskTypes />
      <HowItWorks />
      <DailyRhythm />
      <Features />
      <MentorFeedback />
      <Roles />
      <Faq />
      <CtaBanner />
    </main>

    <Footer />
  </div>
);

export default Page;
