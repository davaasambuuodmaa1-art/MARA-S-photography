"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { localizeSiteContent, SITE_LOCALE_COOKIE, SITE_TEXT, type SiteLocale } from "@/lib/site-locale";
import { cn } from "@/lib/utils";

interface NavCategory {
  slug: string;
  name: string;
  image_count: number;
}

export function SiteHeader({
  categories,
  brandName,
  logoImage,
  announcement,
  user,
  locale,
}: {
  categories: NavCategory[];
  brandName: string;
  logoImage: string | null;
  announcement?: string;
  user: { name: string; role: string } | null;
  locale: SiteLocale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(locale);

  const links = useMemo(
    () => [
      { href: "/work", label: SITE_TEXT[currentLocale].nav.work },
      { href: "/packages", label: SITE_TEXT[currentLocale].nav.sessions },
      { href: "/locations", label: SITE_TEXT[currentLocale].nav.locations },
      { href: "/about", label: SITE_TEXT[currentLocale].nav.about },
      { href: "/contact", label: SITE_TEXT[currentLocale].nav.contact },
    ],
    [currentLocale],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setWorkOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.lang = currentLocale;
    document.cookie = `${SITE_LOCALE_COOKIE}=${currentLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event("site-locale-change"));
  }, [currentLocale]);

  const switchLocale = () => {
    const nextLocale = currentLocale === "en" ? "mn" : "en";
    document.cookie = `${SITE_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    window.dispatchEvent(new Event("site-locale-change"));
    setCurrentLocale(nextLocale);
    router.refresh();
  };

  const solid = true;
  const dark = false;
  const words = brandName.replace("Photography", "").trim();
  const t = SITE_TEXT[currentLocale];

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700",
          solid
            ? "border-b border-ink/10 bg-cream/95 backdrop-blur-xl"
            : "bg-gradient-to-b from-black/55 via-black/20 to-transparent",
        )}
        onMouseLeave={() => setWorkOpen(false)}
      >
        {announcement && overHero && !scrolled ? (
          <div className="border-b border-cream/10 bg-burgundy/90 px-6 py-2.5 text-center text-[9px] uppercase tracking-[0.3em] text-cream/85">
            {announcement}
          </div>
        ) : null}

        <div className="mx-auto flex h-[80px] max-w-[1680px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-3" aria-label={brandName}>
            {logoImage ? (
              <img src={logoImage} alt={brandName} className="h-9 w-auto object-contain" />
            ) : (
              <span className="flex flex-col leading-none">
                <span
                  className={cn(
                    "display text-[24px] tracking-[0.2em] transition-colors sm:text-[26px]",
                    dark ? "text-cream" : "text-ink",
                  )}
                >
                  {words.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "mt-2 text-[7px] uppercase tracking-[0.5em] transition-colors",
                    dark ? "text-cream/60" : "text-smoke",
                  )}
                >
                  Photography — Sydney
                </span>
              </span>
            )}
          </Link>

          <nav
            className={cn(
              "hidden items-center gap-10 text-[10px] uppercase tracking-[0.26em] lg:flex",
              dark ? "text-cream/80" : "text-ink/70",
            )}
          >
            <button
              type="button"
              onMouseEnter={() => setWorkOpen(true)}
              onClick={() => setWorkOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 transition-colors hover:text-champagne",
                pathname.startsWith("/work") && (dark ? "text-cream" : "text-ink"),
              )}
            >
              {t.nav.work}
              <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden>
                <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
            {links.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-champagne",
                  pathname === link.href && (dark ? "text-cream" : "text-ink"),
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={switchLocale}
              className={cn(
                "rounded-full border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.24em] transition-colors",
                dark
                  ? "border-cream/30 text-cream/80 hover:border-cream hover:text-cream"
                  : "border-ink/15 text-ink/70 hover:border-ink/50 hover:text-ink",
              )}
              aria-label={currentLocale === "en" ? "Switch to Mongolian" : "Switch to English"}
            >
              {currentLocale === "en" ? "MN" : "EN"}
            </button>
            <Link
              href="/account"
              aria-label={t.nav.account}
              className={cn(
                "hidden h-9 w-9 items-center justify-center rounded-full border transition-colors sm:flex",
                dark
                  ? "border-cream/30 text-cream/80 hover:border-cream hover:text-cream"
                  : "border-ink/15 text-ink/60 hover:border-ink/50 hover:text-ink",
              )}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4.8 20c1.2-3.7 3.9-5.6 7.2-5.6s6 1.9 7.2 5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              href="/book"
              className={cn(
                "hidden px-6 py-3 text-[10px] uppercase tracking-[0.22em] transition-all duration-500 sm:inline-flex",
                dark
                  ? "bg-cream text-ink hover:bg-champagne"
                  : "bg-ink text-cream hover:bg-burgundy",
              )}
            >
              {t.nav.book}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.nav.menu}
              className={cn(
                "flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden",
                dark ? "text-cream" : "text-ink",
              )}
            >
              <span
                className={cn(
                  "h-px w-6 bg-current transition-transform duration-300",
                  menuOpen && "translate-y-[3.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-px w-6 bg-current transition-transform duration-300",
                  menuOpen && "-translate-y-[3.5px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-full hidden overflow-hidden border-t border-ink/10 bg-cream transition-all duration-500 lg:block",
            workOpen ? "max-h-[520px] opacity-100" : "pointer-events-none max-h-0 opacity-0",
          )}
        >
          <div className="mx-auto grid max-w-[1680px] gap-10 px-12 py-10 md:grid-cols-[1.1fr_2fr]">
            <div>
              <p className="eyebrow">{t.home.menuTitle}</p>
              <p className="display mt-4 text-3xl text-ink">
                {t.home.collectionsIntro.split(" ").slice(0, 2).join(" ")}
                <br />
                {t.home.collectionsIntro.split(" ").slice(2).join(" ")}
              </p>
              <Link
                href="/work"
                className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-ink link-underline"
              >
                {t.nav.viewAllWork}
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 xl:grid-cols-3">
              {categories.slice(0, 18).map((category) => (
                <Link
                  key={category.slug}
                  href={`/work/${category.slug}`}
                  className="group flex items-baseline justify-between border-b border-ink/5 py-2.5 text-[13px] text-ink/75 transition-colors hover:text-ink"
                >
                  <span className="font-serif text-[17px] group-hover:italic">{localizeSiteContent(category.name, currentLocale)}</span>
                  <span className="text-[10px] tracking-[0.16em] text-smoke/70">
                    {String(category.image_count).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink text-cream transition-all duration-500 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto px-7 pb-10 pt-28">
          <p className="eyebrow">{t.nav.menu}</p>
          <nav className="mt-5 flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-cream/10 py-4 font-serif text-3xl"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/book" className="border-b border-cream/10 py-4 font-serif text-3xl">
              {t.nav.book}
            </Link>
            <Link href="/account" className="border-b border-cream/10 py-4 font-serif text-3xl">
              {user ? t.nav.myBookings : t.nav.signIn}
            </Link>
          </nav>
          <p className="eyebrow mt-10">{t.nav.collections}</p>
          <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-cream/70">
            {categories.slice(0, 12).map((c) => (
              <Link key={c.slug} href={`/work/${c.slug}`} className="py-1">
                {localizeSiteContent(c.name, currentLocale).replace(" Photography", "").replace("гэрэл зураг", "")}
              </Link>
            ))}
          </div>
          <Link href="/work" className="mt-6 text-[10px] uppercase tracking-[0.24em] text-champagne">
            {t.nav.viewAllWork} →
          </Link>
        </div>
      </div>
    </>
  );
}
