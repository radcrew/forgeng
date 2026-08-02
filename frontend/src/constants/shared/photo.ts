/**
 * A self-hosted photo under `public/assets/images`, carrying everything
 * `next/image` needs to render it without layout shift: intrinsic dimensions
 * and a 10px blur-up placeholder generated from the same source.
 */
export interface Photo {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly blurDataURL: string;
  readonly alt: string;
}
