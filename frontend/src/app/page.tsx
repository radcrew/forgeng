import {
  CtaBannerSection,
  FaqSection,
  FeaturesSection,
  GallerySection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingHeader,
  MentorFeedbackSection,
  RolesSection,
  StatsSection,
  TaskTypesSection,
  WhoWeAreSection,
} from "@components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <LandingHeader />

      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <WhoWeAreSection />
        <GallerySection />
        <HowItWorksSection />
        <TaskTypesSection />
        <FeaturesSection />
        <MentorFeedbackSection />
        <RolesSection />
        <FaqSection />
        <CtaBannerSection />
      </main>

      <LandingFooter />
    </div>
  );
}
