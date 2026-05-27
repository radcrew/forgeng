import { PHOTOS } from "@constants/landing/photos";

export interface GalleryPhoto {
  src: string;
  alt: string;
  label: string;
}

/**
 * Featured gallery item — rendered larger (2x2) than the rest of the grid.
 */
export const GALLERY_FEATURED: GalleryPhoto = {
  src: PHOTOS.mentoring,
  alt: "A senior engineer mentoring a junior developer at a desk",
  label: "1-on-1 Mentoring",
};

export const GALLERY_PHOTOS: GalleryPhoto[] = [
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
];
