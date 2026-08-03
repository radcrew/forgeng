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

const Page = () => (
  <div className="flex min-h-screen flex-col">
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
