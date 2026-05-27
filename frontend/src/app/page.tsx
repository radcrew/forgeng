import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Code2,
  FolderGit2,
  Hammer,
  MessageSquare,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { Logo } from "@components/brand/logo";

// Stock photography for the marketing visuals. Hosted on Unsplash so no asset
// pipeline is required for the UI-only milestone.
const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85&auto=format&fit=crop",
  mentoring:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=85&auto=format&fit=crop",
  codeReview:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=85&auto=format&fit=crop",
  interview:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=85&auto=format&fit=crop",
  coding:
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=85&auto=format&fit=crop",
  teamMeeting:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=85&auto=format&fit=crop",
  pairProgramming:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&auto=format&fit=crop",
};

const STEPS = [
  {
    number: "01",
    title: "Apply",
    description:
      "Submit a short application telling us about your background, goals, and motivation. No CS degree required — we care about drive.",
    icon: ClipboardList,
    photo: PHOTOS.interview,
    photoAlt: "Applicant in a one-on-one discussion with a reviewer",
  },
  {
    number: "02",
    title: "Join a Cohort",
    description:
      "Accepted applicants are placed into a cohort with a dedicated mentor and peers at the same stage.",
    icon: Users,
    photo: PHOTOS.teamMeeting,
    photoAlt: "Cohort meeting around a table",
  },
  {
    number: "03",
    title: "Complete Real Tasks",
    description:
      "Work through structured coding assignments, reading modules, and projects inside your cohort timeline.",
    icon: Code2,
    photo: PHOTOS.coding,
    photoAlt: "Developer writing code at their computer",
  },
  {
    number: "04",
    title: "Get Expert Feedback",
    description:
      "Mentors review every submission. You receive detailed feedback with a clear verdict — approved or needs work.",
    icon: MessageSquare,
    photo: PHOTOS.codeReview,
    photoAlt: "Two engineers doing a code review together",
  },
  {
    number: "05",
    title: "Level Up",
    description:
      "Track your progress, build a portfolio of real work, and graduate with evidence of what you can actually do.",
    icon: Award,
    photo: PHOTOS.mentoring,
    photoAlt: "Mentor celebrating a student's achievement",
  },
];

const FEATURES = [
  {
    icon: FolderGit2,
    title: "Real Projects",
    description:
      "Every task is hands-on. You write code, push it to GitHub, and get expert eyes on it — not auto-graders.",
  },
  {
    icon: Users,
    title: "Cohort Learning",
    description:
      "You learn alongside peers at the same stage. Cohorts keep you accountable and motivated.",
  },
  {
    icon: MessageSquare,
    title: "Mentor Feedback",
    description:
      "Every submission is reviewed by a working engineer who explains exactly what to improve and why.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Your dashboard shows task completion, submission history, and upcoming deadlines at a glance.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    description:
      "Tasks progress from fundamentals to advanced topics — no guessing what to learn next.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    description:
      "Mentors aim to review submissions within 48 hours so you're never blocked waiting for feedback.",
  },
];

const ROLES = [
  {
    role: "Applicant",
    color: "bg-slate-100 text-slate-700",
    headline: "Your journey starts here.",
    description:
      "Fill out a 3-step application, tell us what drives you, and we'll get back to you. No fees, no prerequisites.",
    cta: "Apply Now",
    href: "/apply",
    photo: PHOTOS.interview,
  },
  {
    role: "Student",
    color: "bg-primary/10 text-primary",
    headline: "Build. Submit. Improve.",
    description:
      "Browse your cohort's task list, submit your code with notes, and see mentor feedback land in your inbox.",
    cta: "Sign In",
    href: "/sign-in",
    photo: PHOTOS.coding,
  },
  {
    role: "Mentor",
    color: "bg-emerald-100 text-emerald-700",
    headline: "Shape the next generation.",
    description:
      "Review queued submissions from your cohort, leave structured feedback, and mark work approved or needing revision.",
    cta: "Sign In",
    href: "/sign-in",
    photo: PHOTOS.mentoring,
  },
];

const STATS = [
  { value: "100%", label: "Hands-on projects" },
  { value: "48h", label: "Average review time" },
  { value: "5", label: "Task types supported" },
  { value: "∞", label: "Cohorts can run at once" },
];

const TASK_TYPES = [
  { icon: Code2, label: "Coding", description: "Write and ship real code" },
  { icon: BookOpen, label: "Reading", description: "Digest technical concepts" },
  { icon: FolderGit2, label: "Projects", description: "End-to-end deliverables" },
  { icon: ClipboardList, label: "Quizzes", description: "Check your understanding" },
];

const FAQS = [
  {
    question: "Do I need a CS degree or prior experience?",
    answer:
      "No. We accept self-taught developers, career switchers, and bootcamp grads alike. The application focuses on motivation and readiness — not credentials. What matters is whether you can put in the hours and you're hungry to actually get good at the craft.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Applications are always free. Tuition for accepted apprentices varies by cohort length and stipend availability — we publish the exact terms in your offer letter. We don't believe in trapping people in long-term debt for short programs.",
  },
  {
    question: "How long is the program?",
    answer:
      "Typical cohorts run 3 to 6 months depending on track, with weekly task deadlines and biweekly mentor reviews. The pace is built for sustainable progress, not burnout.",
  },
  {
    question: "Can I do this while working a full-time job?",
    answer:
      "Most apprentices do. Tasks are async with flexible deadlines, and mentor feedback is asynchronous. Plan for roughly 10 to 15 hours per week to stay on pace with your cohort.",
  },
  {
    question: "How is this different from a bootcamp?",
    answer:
      "Bootcamps front-load lectures and end with a capstone. Forgeng inverts that — from day one you're shipping real tasks reviewed by working engineers. Less classroom, more code review. We're not in the business of teaching syntax; we're in the business of building engineers.",
  },
  {
    question: "Who actually reviews my submissions?",
    answer:
      "Working senior or staff engineers — people writing production code at real companies today. Each cohort has a dedicated lead mentor and a small bench of reviewers, so the feedback you get is consistent and personal.",
  },
];

const VALUES = [
  {
    icon: Hammer,
    title: "Real work, not theory",
    description:
      "We don't drill leetcode. Every task mirrors something a working engineer actually does on the job.",
  },
  {
    icon: Users,
    title: "Mentors who ship",
    description:
      "Reviewers are senior+ engineers writing production code today — not academics or career coaches.",
  },
  {
    icon: Target,
    title: "Outcomes over vibes",
    description:
      "Every submission gets an explicit verdict and concrete next steps. Progress is measurable, not vibes-based.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} priority />
          <span className="font-bold text-lg tracking-tight">Forgeng</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a
            href="#who-we-are"
            className="hover:text-foreground transition-colors"
          >
            About
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#roles"
            className="hover:text-foreground transition-colors"
          >
            For You
          </a>
          <a
            href="#faq"
            className="hover:text-foreground transition-colors"
          >
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium hover:text-primary transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Button asChild size="sm" className="font-semibold">
            <Link href="/apply">
              Apply Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="text-primary border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide"
              >
                Applications Open
              </Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Master Software{" "}
                <span className="text-primary">Engineering</span> the Right Way.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A rigorous, mentor-led apprenticeship. Apply, join a cohort,
                complete real projects, get expert code review, and build the
                skills that actually get you hired.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
                >
                  <Link href="/apply">
                    Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
                >
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Free to apply · No CS degree required · Real mentor feedback
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS.hero}
                alt="Two professionals collaborating on code in a modern office"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-background/90 backdrop-blur rounded-xl p-3 flex items-center gap-3 shadow">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    S
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Mentor Sarah reviewed your submission
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Binary Search Tree —{" "}
                      <span className="text-primary font-medium">
                        Approved ✓
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-extrabold text-primary">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO WE ARE */}
        <section id="who-we-are" className="px-6 py-24">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5] order-2 md:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS.pairProgramming}
                alt="Two engineers pair-programming side by side"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 bg-background/95 backdrop-blur rounded-xl p-4 shadow-lg border border-border/40">
                <p className="text-[11px] font-bold tracking-widest text-primary">
                  OUR MISSION
                </p>
                <p className="text-sm mt-2 leading-relaxed">
                  Make the path from{" "}
                  <span className="font-semibold">learning to code</span> to{" "}
                  <span className="font-semibold">
                    shipping production-quality work
                  </span>{" "}
                  repeatable, structured, and humane.
                </p>
              </div>
            </div>

            <div className="space-y-6 order-1 md:order-2">
              <Badge
                variant="outline"
                className="text-xs font-semibold tracking-wide"
              >
                Who We Are
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Built by engineers, for engineers.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Forgeng started because we saw a gap: too many programs teach
                students to pass interviews instead of teaching them to ship.
                We&apos;re a small team of working software engineers who
                learned the craft the way it&apos;s actually learned — through
                mentorship from people who&apos;d built real systems. We
                rebuilt that experience into something anyone driven enough
                can access.
              </p>

              <div className="space-y-5 pt-2">
                {VALUES.map((value) => {
                  const Icon = value.icon;
                  return (
                    <div key={value.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">{value.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PHOTO GALLERY */}
        <section
          id="life-in-program"
          className="border-t border-border px-6 py-24"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <Badge
                variant="outline"
                className="text-xs font-semibold tracking-wide"
              >
                Life in the Program
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                What the Day-to-Day Looks Like
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Mentoring sessions, code reviews, cohort syncs, pair
                programming — this is what real learning looks like.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[480px]">
              <div className="relative rounded-2xl overflow-hidden col-span-2 row-span-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS.mentoring}
                  alt="A senior engineer mentoring a junior developer at a desk"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white/10 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                    1-on-1 Mentoring
                  </span>
                </div>
              </div>

              {[
                {
                  src: PHOTOS.codeReview,
                  alt: "Two engineers collaborating on a code review",
                  label: "Code Review",
                },
                {
                  src: PHOTOS.interview,
                  alt: "Technical discussion in an interview setting",
                  label: "Intake Interview",
                },
                {
                  src: PHOTOS.teamMeeting,
                  alt: "Cohort group meeting and discussion",
                  label: "Cohort Sync",
                },
                {
                  src: PHOTOS.pairProgramming,
                  alt: "Developer pair programming at a laptop",
                  label: "Pair Programming",
                },
              ].map((photo) => (
                <div
                  key={photo.label}
                  className="relative rounded-2xl overflow-hidden group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[180px] md:min-h-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/10 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
                      {photo.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="border-t border-border bg-muted/20 px-6 py-24"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <Badge
                variant="outline"
                className="text-xs font-semibold tracking-wide"
              >
                Process
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                How Forgeng Works
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A structured, repeatable path from applicant to skilled engineer
                — with a mentor beside you every step.
              </p>
            </div>

            <div className="space-y-16">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={step.number}
                    className={`grid md:grid-cols-2 gap-10 items-center ${
                      isEven ? "" : "md:[direction:rtl]"
                    }`}
                  >
                    <div
                      className={`relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] ${
                        isEven ? "" : "md:[direction:ltr]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step.photo}
                        alt={step.photoAlt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent mix-blend-multiply" />
                    </div>

                    <div
                      className={`space-y-4 ${
                        isEven ? "" : "md:[direction:ltr]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground tracking-widest">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TASK TYPES */}
        <section className="border-y border-border bg-muted/30 px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight">
                Four Types of Work
              </h2>
              <p className="text-muted-foreground mt-2">
                Every assignment is purpose-built to grow a specific skill.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TASK_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <Card
                    key={t.label}
                    className="text-center hover:shadow-md transition-shadow border-border/60"
                  >
                    <CardContent className="p-6 space-y-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold tracking-wide"
            >
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything You Need to Grow
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built to give apprentices the same feedback loop that top
              engineers enjoy at elite companies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="border-border/60 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* MENTOR FEEDBACK */}
        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS.codeReview}
                alt="Two engineers sitting side-by-side doing a code review"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <blockquote className="text-white text-sm leading-relaxed italic">
                  &ldquo;The best part of this program is that you get feedback
                  from engineers who actually ship code every day — not
                  automated tests that just check if your output matches.&rdquo;
                </blockquote>
                <p className="text-white/70 text-xs mt-2 font-medium">
                  — Former Apprentice, now Mid-level Engineer
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="text-xs font-semibold tracking-wide"
                >
                  Mentor Feedback
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight">
                  Code Review That Actually Teaches You
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Generic &ldquo;looks good&rdquo; isn&apos;t feedback —
                  it&apos;s a missed opportunity. Every submission gets a
                  detailed verdict with concrete suggestions, explained in plain
                  language by a working engineer.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Written feedback on every submission",
                    "Approve or Needs Work verdict",
                    "Resubmit after revisions",
                    "Full history preserved for review",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Card className="border-primary/30 shadow">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          S
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Mentor Sarah</p>
                          <p className="text-xs text-muted-foreground">
                            Senior Engineer
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Approved
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                      &ldquo;Great job handling the edge case in your sort
                      function. Extracting the comparison logic into its own
                      function would make this much easier to unit-test. Really
                      clean solution overall!&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-muted-foreground">
                        Task: Implement a Binary Search Tree
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-destructive/20">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">
                          J
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Mentor James</p>
                          <p className="text-xs text-muted-foreground">
                            Staff Engineer
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Needs Work
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-destructive/30 pl-3">
                      &ldquo;The core logic is right but error handling is
                      missing. What happens on a 500? Add a try/catch and
                      surface a user-friendly message.&rdquo;
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="px-6 py-24 max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold tracking-wide"
            >
              Who Is This For
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Find Your Place on the Platform
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you&apos;re learning, teaching, or managing — there&apos;s
              a role designed for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r) => (
              <Card
                key={r.role}
                className="border-border/60 flex flex-col hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.photo}
                      alt={`${r.role} scenario`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    <Badge
                      className={`self-start text-xs font-semibold ${r.color} border-0`}
                    >
                      {r.role}
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-lg">{r.headline}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={r.href}>
                        {r.cta} <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="border-t border-border bg-muted/30 px-6 py-24"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <Badge
                variant="outline"
                className="text-xs font-semibold tracking-wide"
              >
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Questions, Answered
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                The things people most often want to know before applying. Don&apos;t
                see your question? Reach out — we read every email.
              </p>
            </div>

            <Card className="border-border/60">
              <CardContent className="px-6 py-2">
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, i) => (
                    <AccordionItem key={faq.question} value={`item-${i}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="mt-10 text-center">
              <p className="text-sm text-muted-foreground">
                Still have questions?{" "}
                <Link
                  href="/apply"
                  className="text-primary font-semibold hover:underline"
                >
                  Start an application
                </Link>{" "}
                — applying is free and we get back to every applicant.
              </p>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="relative overflow-hidden px-6 py-20 bg-primary text-primary-foreground text-center">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS.teamMeeting}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-10"
            />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready to become a real engineer?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
              Applications take under 10 minutes. We review every one personally
              and get back to you within a week.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-semibold w-full sm:w-auto"
              >
                <Link href="/apply">
                  Apply Now — It&apos;s Free{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
              >
                <Link href="/sign-in">Already a member? Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-semibold text-sm">Forgeng</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for engineers who are serious about getting better.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href="/apply"
              className="hover:text-foreground transition-colors"
            >
              Apply
            </Link>
            <Link
              href="/sign-in"
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
