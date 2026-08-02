import { PHOTOS } from "@constants/landing/photos";
import type { Photo } from "@constants/shared/photo";

export interface GalleryPhoto {
  photo: Photo;
  label: string;
}

/**
 * Featured gallery item — rendered larger (2x2) than the rest of the grid.
 */
export const GALLERY_FEATURED: GalleryPhoto = {
  photo: PHOTOS.galleryMentoring,
  label: "1-on-1 Mentoring",
};

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    photo: PHOTOS.galleryReview,
    label: "Code Review",
  },
  {
    photo: PHOTOS.galleryIntake,
    label: "Intake Interview",
  },
  {
    photo: PHOTOS.gallerySync,
    label: "Cohort Sync",
  },
  {
    photo: PHOTOS.galleryPairing,
    label: "Pair Programming",
  },
];
