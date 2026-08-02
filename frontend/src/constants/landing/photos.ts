import type { Photo } from "@constants/shared/photo";

/**
 * Marketing photography, self-hosted under `public/assets/images` and graded
 * to one consistent look. Every slot on the page gets its own photo — none is
 * reused across sections.
 */
export const PHOTOS = {
  hero: {
    src: "/assets/images/hero.webp",
    width: 1200,
    height: 900,
    blurDataURL:
      "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAAAQAgCdASoKAAgAA4BaJYgCdAEQzWfaH99YAP7ZhovQaAheYnAtRY5+CeKuPatICenGf8hGIy2HiQE45MT4mKm3/O5JfqEKb4DdaixOLeE4AAAA",
    alt: "Three apprentices talking over a laptop in a shared workspace",
  },
  mission: {
    src: "/assets/images/mission.webp",
    width: 900,
    height: 1125,
    blurDataURL:
      "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAABQAgCdASoKAAwAA4BaJQBOgMW0ttdek4rSGAAA9r+qFTcBy3Mdt5gJre74+O6g3sxeDZ7oDXDmtQTQLVsrWeFu+mWftY6OaGmg4MClY3f3dd6VkAA=",
    alt: "An engineer looking over a teammate's shoulder while she works at a laptop",
  },
  codeReview: {
    src: "/assets/images/codeReview.webp",
    width: 1000,
    height: 750,
    blurDataURL:
      "data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAACwAQCdASoKAAcAA4BaJZwAAxeQbtQAAP70xYwuquh+++l4d0HfRitx3ZGpIcc7KnGhUClwQAA=",
    alt: "Two engineers reading through code together on a monitor",
  },
  cohortEnergy: {
    src: "/assets/images/cohortEnergy.webp",
    width: 1600,
    height: 900,
    blurDataURL:
      "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAACwAQCdASoKAAYAA4BaJYwCdADZlgtAAP7YIa6ApKZS18LpUTB5aTUiMUTCtaH6JUwz39xAVQQc8lK/5DDIuvgGAAA=",
    alt: "A group of developers laughing around a laptop",
  },
  galleryMentoring: {
    src: "/assets/images/galleryMentoring.webp",
    width: 1000,
    height: 800,
    blurDataURL:
      "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADQAQCdASoKAAgAA4BaJQBfnBtqhbBSIADif3TTsPpZ2DwKBmWpUXFTHrES8rjPfYfEJHeuno/qx+7ufFqR//fmdf83CqLgAAA=",
    alt: "A mentor leaning over a desk to walk an apprentice through their work",
  },
  galleryReview: {
    src: "/assets/images/galleryReview.webp",
    width: 700,
    height: 560,
    blurDataURL:
      "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAAAQAgCdASoKAAgAA4BaJZACsADhkIF4RZQAAOJ6bg83aqaunk+U9zHxCv6EUpXHkBnUnkJ3X/3cNuHJGprIX0R6ypEKWNyB9YLxMH8AAAA=",
    alt: "Two people reviewing written work together at a desk",
  },
  galleryIntake: {
    src: "/assets/images/galleryIntake.webp",
    width: 700,
    height: 560,
    blurDataURL:
      "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQAgCdASoKAAgAA4BaJZQC7AD8ZO6v8RhgAOJ+MnOA7Fhvr8dzDfDIWv49RYAmvGOai+GN6RhLrbUm3UZqLJzu28iJ2icfNWjz1BkEJsAAAA==",
    alt: "Two people in conversation across a table by a window",
  },
  gallerySync: {
    src: "/assets/images/gallerySync.webp",
    width: 700,
    height: 560,
    blurDataURL:
      "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADQAQCdASoKAAgAA4BaJZwC7ADdlRPgAAD+2rPWglavwHw7poIgh71gDuj42oH3m9L1fIdzyEKvq0BMm/7Fw+67ev2OAAAA",
    alt: "Several people working on laptops around a long shared table",
  },
  galleryPairing: {
    src: "/assets/images/galleryPairing.webp",
    width: 700,
    height: 560,
    blurDataURL:
      "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADQAQCdASoKAAgAA4BaJZwCdADciNsFRgD+0kdQaw1oIUQ4joz9nqoy78Hsf+9mFWbMatn0YBWz0h94jcaAAA==",
    alt: "Two developers pair programming on one laptop",
  },
  stepApply: {
    src: "/assets/images/stepApply.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAACwAQCdASoKAAYAA4BaJYwCdADZlN2AAPwpmnXaMDXGNkm7I/nit3p0cD/DhUiAuSTlCM5tFQFMjN1WOvPU3KgA",
    alt: "Two people filling in forms on laptops outdoors",
  },
  stepCohort: {
    src: "/assets/images/stepCohort.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADwAQCdASoKAAYAA4BaJaAC7AEQzEXF5MgA4hiH3CH7PedakUrhJIn1qIaJi2oxWpMD+2E3IjogvXVnfEZitoUiLjzlQAAA",
    alt: "Four teammates gathered around one laptop",
  },
  stepTasks: {
    src: "/assets/images/stepTasks.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAACwAQCdASoKAAYAA4BaJQBOgCFlKhfQAPj7RafhOshWxfxHKGzZ+IeLTe2FXWiqGbj+4FHfL9yNSKmteORmuLaFGOk48gcf/O4ZbEAA",
    alt: "A developer writing code at a two-monitor desk",
  },
  stepFeedback: {
    src: "/assets/images/stepFeedback.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADQAQCdASoKAAYAA4BaJYwCdAD0HRxCAADiZOXyvh01MFM7HZxxbP66au9vFndI+FbNdKVCjCEIsYnBxjAAAA==",
    alt: "Two people reading through work together on a laptop",
  },
  stepStipend: {
    src: "/assets/images/stepStipend.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADwAQCdASoKAAYAA4BaJQBOgB6TQT/hnAAA/rZ2Ss+ovKjWEKHTwaq13RK2q0J2rY7hDBvwGqLnL56J64bryRGG4kFEz5AAAAA=",
    alt: "A team gathered around a laptop, pleased with the result",
  },
  stepLevelUp: {
    src: "/assets/images/stepLevelUp.webp",
    width: 1000,
    height: 625,
    blurDataURL:
      "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADwAQCdASoKAAYAA4BaJQBOgB9lZlhTXAAA/vHgOtGGF099igGAVBHgy+b6zKk4ErIxaH7k2ACNV1AAAAA=",
    alt: "An engineer laughing while presenting at a whiteboard",
  },
  roleApplicant: {
    src: "/assets/images/roleApplicant.webp",
    width: 800,
    height: 360,
    blurDataURL:
      "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAQCdASoKAAUAA4BaJZgCdADcO3ch4AD+9moXI0Rf8Z2HZP7dbFPnUgQd63N/iaEQ1SiteHc9JCEYAAA=",
    alt: "Two people talking across a table in warm light",
  },
  roleStudent: {
    src: "/assets/images/roleStudent.webp",
    width: 800,
    height: 360,
    blurDataURL:
      "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAQCdASoKAAUAA4BaJZQCdIExExsGKAD+ifVNkNI++exOAbEq5Sfr0zZvmEHmv1mOT26Gf3oMk66LcMtwLJSQAAA=",
    alt: "A developer writing code on a laptop",
  },
  roleAdmin: {
    src: "/assets/images/roleAdmin.webp",
    width: 800,
    height: 360,
    blurDataURL:
      "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADQAQCdASoKAAUAA4BaJQBOgCLP+rUz0AD+0rBmHewxiRPuxg5zrln2lij4dxat/AwdrflXcqUHDJQQ7wAAAA==",
    alt: "Two people mapping out a plan on a whiteboard",
  },
} as const satisfies Record<string, Photo>;
