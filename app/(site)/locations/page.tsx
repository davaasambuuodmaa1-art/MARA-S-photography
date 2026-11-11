import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import {
  getLocations,
  getSiteSettings,
  locationImages,
  locationStyles,
} from "@/lib/data";
import { formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sydney locations",
  description:
    "The Sydney locations Mara knows best — from Bondi at first light to the Blue Mountains — with travel fees and permit notes.",
};

function permitLabel(status: string, approved: number) {
  if (status === "approved" && approved) return "Commercial photography approved";
  if (status === "not_required") return "No permit required";
  if (status === "required") return "Permit required — arranged before your session";
  return "Permit to be confirmed";
}

export default async function LocationsPage() {
  const [locations, settings] = await Promise.all([getLocations(), getSiteSettings()]);
  const areas = [...new Set(locations.map((location) => location.area))];

  return (
    <>
      <section className="border-b border-ink/10 pb-14 pt-36 lg:pb-20 lg:pt-44">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow">Locations</p>
            <h1 className="display mt-5 max-w-4xl text-balance text-[clamp(2.8rem,6.4vw,5.6rem)] text-ink">
              Sydney, photographed <span className="editorial text-burgundy">on location</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-smoke">
              There is no studio. Mara travels to you — a headland at sunrise, a terrace in Paddington,
              a stretch of coast you have never shown anyone. These are the places she knows best.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.22em] text-smoke">
            <span>{locations.length} locations</span>
            <span>{areas.join(" · ")}</span>
            <span>Travel quoted before you book</span>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location, index) => {
            const cover = locationImages(location)[0] ?? location.cover_image;
            return (
              <Reveal key={location.id} delay={index * 50}>
                <Link
                  href={`/locations/${location.slug}`}
                  className="group block"
                  data-cursor
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                    {cover ? (
                      <img
                        src={cover}
                        alt={location.name}
                        loading="lazy"
                        className="grade h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[9px] uppercase tracking-[0.28em] text-cream/70">
                        {String(index + 1).padStart(2, "0")} · {location.area}
                      </p>
                      <p className="mt-1 font-serif text-2xl text-cream">{location.name}</p>
                    </div>
                    <span className="absolute right-4 top-4 bg-cream/95 px-2.5 py-1 text-[8px] uppercase tracking-[0.18em] text-ink">
                      {location.travel_fee > 0 ? `+${formatAUD(location.travel_fee)} travel` : "Travel included"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-smoke/80">
                      {locationStyles(location).join(" · ")}
                    </p>
                    <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      View →
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-smoke/60">
                    {permitLabel(location.permit_status, location.venue_approved)}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-16 grid gap-8 border-t border-ink/10 pt-12 sm:grid-cols-3">
          {[
            {
              title: "Travel",
              body: settings.travelPolicy,
            },
            {
              title: "Permits & venues",
              body:
                "Every location is checked for council or venue permission before it is confirmed. Nothing is advertised as approved for commercial photography until that check is done.",
            },
            {
              title: "Weather",
              body: settings.rainPolicy,
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="eyebrow">{item.title}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-smoke">{item.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-14 flex flex-wrap gap-4 border-t border-ink/10 pt-10">
          <Link href="/book" className="btn-dark">
            Start a booking
          </Link>
          <Link href="/contact" className="btn-outline">
            Suggest a location
          </Link>
        </Reveal>
      </section>
    </>
  );
}
