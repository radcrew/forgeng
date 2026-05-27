import {
  CtaBanner,
  Faq,
  Features,
  Footer,
  Gallery,
  Header,
  Hero,
  HowItWorks,
  MentorFeedback,
  Roles,
  Stats,
  TaskTypes,
  WhoWeAre,
} from "@components/landing";

const LandingPage = () => (
  <div className="min-h-screen bg-background flex flex-col text-foreground">
    <Header />

    <main className="flex-1">
      <Hero />
      <Stats />
      <WhoWeAre />
      <Gallery />
      <HowItWorks />
      <TaskTypes />
      <Features />
      <MentorFeedback />
      <Roles />
      <Faq />
      <CtaBanner />
    </main>

    <Footer />
  </div>
);

export default LandingPage;
