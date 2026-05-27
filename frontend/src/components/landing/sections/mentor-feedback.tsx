import { CheckCircle2, Star } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import {
  FEEDBACK_BULLETS,
  FEEDBACK_TESTIMONIAL,
  PHOTOS,
  SAMPLE_FEEDBACK,
} from "@constants/landing";

export function MentorFeedback() {
  return (
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
              &ldquo;{FEEDBACK_TESTIMONIAL.quote}&rdquo;
            </blockquote>
            <p className="text-white/70 text-xs mt-2 font-medium">
              {FEEDBACK_TESTIMONIAL.attribution}
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
              {FEEDBACK_BULLETS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {SAMPLE_FEEDBACK.map((sample) => {
              const isApproved = sample.verdict === "approved";
              return (
                <Card
                  key={sample.mentorName}
                  className={
                    isApproved
                      ? "border-primary/30 shadow"
                      : "border-destructive/20"
                  }
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isApproved
                              ? "bg-primary/10 text-primary"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {sample.mentorInitial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {sample.mentorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sample.mentorTitle}
                          </p>
                        </div>
                      </div>
                      {isApproved ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Needs Work
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm text-muted-foreground leading-relaxed border-l-2 pl-3 ${
                        isApproved
                          ? "border-primary/30"
                          : "border-destructive/30"
                      }`}
                    >
                      &ldquo;{sample.comment}&rdquo;
                    </p>
                    {sample.taskFooter && (
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-muted-foreground">
                          {sample.taskFooter}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
