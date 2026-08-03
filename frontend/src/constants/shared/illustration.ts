/**
 * The panel an illustration sits on. Each marketing illustration is retinted to
 * one hue, and the panel behind it uses the matching tint.
 */
export type IllustrationTint =
  | "cyan"
  | "violet"
  | "blue"
  | "mint"
  | "amber"
  | "rose"
  | "coral";

/**
 * A self-hosted illustration under `public/assets/illustrations`. Sourced from
 * unDraw (MIT) with the accent recoloured to the brand. Dimensions come from
 * the SVG viewBox and exist to reserve space, not to fix the rendered size.
 */
export interface Illustration {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Only the marketing set is tinted; app empty-state art omits this. */
  readonly tint?: IllustrationTint;
}
