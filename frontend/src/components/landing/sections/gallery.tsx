import { Badge } from "@components/ui/badge";
import { GALLERY_FEATURED, GALLERY_PHOTOS } from "@constants/landing";

export function Gallery() {
  return (
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
            Mentoring sessions, code reviews, cohort syncs, pair programming —
            this is what real learning looks like.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[480px]">
          <div className="relative rounded-2xl overflow-hidden col-span-2 row-span-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GALLERY_FEATURED.src}
              alt={GALLERY_FEATURED.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="bg-white/10 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                {GALLERY_FEATURED.label}
              </span>
            </div>
          </div>

          {GALLERY_PHOTOS.map((photo) => (
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
  );
}
