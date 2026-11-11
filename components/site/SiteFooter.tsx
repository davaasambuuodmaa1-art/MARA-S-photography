import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SiteFooter({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: CategoryWithCount[];
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-burgundy/70 bg-ink text-cream">
      <div className="mx-auto max-w-[1680px] px-6 pb-10 pt-20 sm:px-10 lg:px-16">
        <div className="grid gap-14 border-b border-cream/10 pb-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="display text-[36px] tracking-[0.14em]">{settings.brandName.replace("Photography", "").trim().toUpperCase()}</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.5em] text-cream/45">Photography</p>
            <p className="editorial mt-6 text-2xl text-cream/85">{settings.tagline}</p>
            <p className="mt-3 max-w-xs text-[12px] font-light leading-relaxed text-cream/50">
              An on-location editorial photography practice, travelling to you across Sydney
              and beyond.
            </p>
            <div className="mt-7 flex gap-5 text-[10px] uppercase tracking-[0.2em] text-cream/60">
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="link-underline hover:text-champagne">
                Instagram
              </a>
              <a href={settings.facebook} target="_blank" rel="noreferrer" className="link-underline hover:text-champagne">
                Facebook
              </a>
              <a href={settings.pinterest} target="_blank" rel="noreferrer" className="link-underline hover:text-champagne">
                Pinterest
              </a>
            </div>
          </div>

          <div>
            <p className="eyebrow text-champagne/80">Collections</p>
            <ul className="mt-5 space-y-2.5 text-sm text-cream/60">
              {categories.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link href={`/work/${c.slug}`} className="transition-colors hover:text-champagne">
                    {c.name.replace(" Photography", "")}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/work" className="text-champagne/90">All work →</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-champagne/80">Explore</p>
            <ul className="mt-5 space-y-2.5 text-sm text-cream/60">
              {[
                { href: "/about", label: "About Mara" },
                { href: "/locations", label: "Sydney locations" },
                { href: "/packages", label: "Sessions & pricing" },
                { href: "/book", label: "Book a session" },
                { href: "/booking/lookup", label: "Check a booking" },
                { href: "/contact", label: "Contact" },
                { href: "/account", label: "Client account" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-champagne">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow text-champagne/80">Service area</p>
            <address className="mt-5 space-y-3 text-sm not-italic leading-relaxed text-cream/60">
              <p>{settings.address}</p>
              <p>
                <a href={`mailto:${settings.email}`} className="link-underline hover:text-champagne">
                  {settings.email}
                </a>
              </p>
              <p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-champagne">
                  {settings.phone}
                </a>
              </p>
              <p className="text-cream/40">Shoots by appointment · seven days · AEST</p>
            </address>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "mt-6 inline-flex items-center gap-2 border border-cream/25 px-5 py-3",
                "text-[10px] uppercase tracking-[0.22em] text-cream/80 transition-colors hover:border-champagne hover:text-champagne",
              )}
            >
              WhatsApp Mara
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 text-[10px] uppercase tracking-[0.18em] text-cream/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.brandName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span>Sydney · Australia · Worldwide</span>
            <Link href="/admin" className="transition-colors hover:text-champagne">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
