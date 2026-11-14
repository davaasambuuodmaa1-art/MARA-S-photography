import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/site/Reveal";
import {
  getLocationBySlug,
  getLocations,
  getSiteSettings,
  locationImages,
  locationStyles,
} from "@/lib/data";
import { formatAUD } from "@/lib/utils";
import { currentSiteLocale } from "@/lib/current-site-locale";
import { localizeSiteContent } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  return {
    title: location ? `${location.name} · Locations` : "Location",
    description: location?.description,
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mn = (await currentSiteLocale()) === "mn";
  const location = await getLocationBySlug(slug);
  if (!location || !location.available) notFound();

  const [settings, others] = await Promise.all([getSiteSettings(), getLocations()]);
  const images = locationImages(location);
  const styles = locationStyles(location);
  const approved = location.permit_status === "approved" && Boolean(location.venue_approved);

  const permit = approved
    ? (mn ? "Энэ байршилд арилжааны зураг авалт хийхийг зөвшөөрсөн." : "Commercial photography approved for this location.")
    : location.permit_status === "not_required"
      ? (mn ? "Энд жижиг хэмжээний хөрөг зураг авалтад зөвшөөрөл шаардлагагүй." : "No permit required for small portrait sessions here.")
      : location.permit_status === "required"
        ? (mn ? "Зөвлөл эсвэл талбайн зөвшөөрөл шаардлагатай. Мара зураг авалтаас өмнө үүнийг зохицуулж баталгаажуулна." : "A council or venue permit is required. Mara arranges and confirms this before your session.")
        : (mn ? "Зөвшөөрлийн шаардлагыг одоогоор шалгаж байна. Зөвшөөрөгдсөн гэж зарлаагүй." : "Permit requirements are still being confirmed. It is not advertised as approved.");

  return (
    <>
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0">
          {images[0] ? (
            <img src={images[0]} alt={location.name} className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
        </div>
        <div className="relative mx-auto max-w-[1680px] px-6 pb-16 pt-40 sm:px-10 lg:px-16 lg:pb-20 lg:pt-48">
          <Reveal>
            <Link
              href="/locations"
              className="text-[9px] uppercase tracking-[0.24em] text-cream/60 transition-colors hover:text-cream"
            >
              {mn ? "← Бүх байршил" : "← All locations"}
            </Link>
            <p className="mt-6 text-[9px] uppercase tracking-[0.3em] text-champagne">{localizeSiteContent(location.area, mn ? "mn" : "en")}</p>
            <h1 className="display mt-3 max-w-3xl text-balance text-[clamp(2.6rem,6vw,5.2rem)] text-cream">
              {localizeSiteContent(location.name, mn ? "mn" : "en")}
            </h1>
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-cream/70">{localizeSiteContent(location.description, mn ? "mn" : "en")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.2em] text-cream/60">
              <span>{location.travel_fee > 0 ? `+${formatAUD(location.travel_fee)} ${mn ? "аяллын зардал" : "travel"}` : (mn ? "Аяллын зардал багтсан" : "Travel included")}</span>
              {location.min_spend > 0 ? <span>{mn ? "Захиалгын доод дүн" : "Min. session"} {formatAUD(location.min_spend)}</span> : null}
              <span>{styles.map((style) => localizeSiteContent(style, mn ? "mn" : "en")).join(" · ")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image, index) => (
                <div
                  key={image}
                  className={`overflow-hidden bg-sand ${index === 0 ? "sm:col-span-2" : ""}`}
                >
                  <img
                    src={image}
                    alt={`${location.name} ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className={`grade w-full object-cover ${index === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <div>
              <p className="eyebrow">{mn ? "Мэдэхэд илүүдэхгүй" : "Good to know"}</p>
              <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-smoke">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-smoke/60">{mn ? "Очих зам" : "Getting there"}</p>
                  <p className="mt-1">{localizeSiteContent(location.travel_info || (mn ? "Аяллын мэдээллийг захиалгатай хамт баталгаажуулна." : "Travel details confirmed with your booking."), mn ? "mn" : "en")}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-smoke/60">{mn ? "Зөвшөөрөл ба нэвтрэх нөхцөл" : "Permits & access"}</p>
                  <p className="mt-1">{localizeSiteContent(location.requirements || (mn ? "Захиалгыг баталгаажуулахаас өмнө шалгана." : "Checked before your session is confirmed."), mn ? "mn" : "en")}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-smoke/60">{mn ? "Аяллын зардал" : "Travel fee"}</p>
                  <p className="mt-1">
                    {location.travel_fee > 0
                      ? (mn ? `${formatAUD(location.travel_fee)} үнийн саналд нэмэгдэнэ. ${localizeSiteContent(settings.travelPolicy, "mn")}` : `${formatAUD(location.travel_fee)} added to your quote. ${settings.travelPolicy}`)
                      : (mn ? "Хотын төвөөс 15 км-ийн доторх зураг авалтад багтсан." : "Included in every session within 15 km of the CBD.")}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`border p-4 text-[11px] leading-relaxed ${
                approved
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {permit}
            </div>

            <div className="border border-ink/12 bg-white/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">{mn ? "Энэ байршлыг сонгох" : "Reserve this location"}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-smoke">
                {mn
                  ? "Байршлыг автоматаар баталгаажуулахгүй. Мара хүсэлт бүрийг хянаж, зөвшөөрлийг шалгаад товыг баталгаажуулна."
                  : "Locations are never confirmed automatically — Mara reviews each request, checks permits and comes back to you with a confirmed time."}
              </p>
              <Link
                href={`/book?location=${location.slug}${styles[0] ? `&category=${styles[0].toLowerCase()}-photography` : ""}`}
                className="btn-dark mt-4 w-full"
              >
                {mn ? `${location.name} дээр захиалах` : `Book at ${location.name}`}
              </Link>
              {location.maps_url ? (
                <a
                  href={location.maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-center text-[9px] uppercase tracking-[0.2em] text-gold link-underline"
                >
                  {mn ? "Газрын зураг нээх →" : "Open in maps →"}
                </a>
              ) : null}
            </div>

            <div className="border border-ink/10 bg-white/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">{mn ? "Цаг агаарын нөхцөл" : "Rain policy"}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-smoke">{localizeSiteContent(settings.rainPolicy, mn ? "mn" : "en")}</p>
            </div>
          </aside>
        </div>

        <div className="mt-20">
          <p className="eyebrow">{mn ? "Ойролцоох байршлууд" : "Nearby"}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others
              .filter((other) => other.id !== location.id)
              .slice(0, 4)
              .map((other) => (
                <Link key={other.id} href={`/locations/${other.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-sand">
                    {(locationImages(other)[0] ?? other.cover_image) ? (
                      <img
                        src={locationImages(other)[0] ?? other.cover_image}
                        alt={localizeSiteContent(other.name, mn ? "mn" : "en")}
                        loading="lazy"
                        className="grade h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <p className="mt-3 font-serif text-lg">{localizeSiteContent(other.name, mn ? "mn" : "en")}</p>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-smoke">{localizeSiteContent(other.area, mn ? "mn" : "en")}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
