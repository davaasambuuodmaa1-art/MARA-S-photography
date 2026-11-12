import Link from "next/link";
import { AdminAccessManager } from "@/components/admin/AdminAccessManager";
import { getCategories, getPackages, getSiteSettings } from "@/lib/data";
import { isAdminAccessSetupComplete } from "@/lib/auth";

export const dynamic = "force-dynamic";

function StepCard({
  number,
  title,
  description,
  complete,
  links,
  children,
}: {
  number: string;
  title: string;
  description: string;
  complete: boolean;
  links?: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border border-ink/12 bg-white/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="font-serif text-3xl text-champagne">{number}</span>
          <div>
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-smoke">{description}</p>
          </div>
        </div>
        <span
          className={`border px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] ${
            complete
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-800"
          }`}
        >
          {complete ? "Ready" : "Needs setup"}
        </span>
      </div>
      {links?.length ? (
        <div className="flex flex-wrap gap-2 pl-0 sm:pl-14">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn-outline py-2.5 text-[9px]">
              {link.label} →
            </Link>
          ))}
        </div>
      ) : null}
      {children ? <div className="border-t border-ink/10 pt-5 sm:ml-14">{children}</div> : null}
    </section>
  );
}

export default async function OwnerSetupPage() {
  const [settings, categories, packages, accessReady] = await Promise.all([
    getSiteSettings(),
    getCategories(false),
    getPackages(false),
    isAdminAccessSetupComplete(),
  ]);
  const businessReady = Boolean(
    settings.brandName.trim() &&
      settings.founderName.trim() &&
      settings.email.trim() &&
      settings.phone.trim() &&
      settings.address.trim() &&
      settings.logoImage &&
      settings.founderPortrait,
  );
  const paymentsReady =
    (settings.cardEnabled || settings.walletEnabled || settings.bankEnabled) &&
    settings.depositPercent >= 0 &&
    settings.depositPercent <= 100;
  const contentReady = Boolean(
    settings.heroTitle.trim() && settings.heroImage && settings.aboutBody.trim(),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Owner onboarding</p>
        <h1 className="display mt-2 text-3xl">Set up Mara&apos;s Photography</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-smoke">
          Work through these six sections. Each editor saves directly to the website, so you can
          update business details, services, pricing, payments and content without changing code.
        </p>
      </header>

      <div className="space-y-4">
        <StepCard
          number="01"
          title="Business information"
          description="Set the business name, photographer profile, Gmail, phone, location, description, logo and social links."
          complete={businessReady}
          links={[
            { href: "/admin/general", label: "Business details & policies" },
            { href: "/admin/founder", label: "Full name & profile photo" },
            { href: "/admin/content", label: "Logo, description & social links" },
          ]}
        />
        <StepCard
          number="02"
          title="Photography services"
          description="Add, edit, publish, reorder, hide or delete service categories such as portraits, couples, families, graduations, weddings, events, fashion, lifestyle or custom work."
          complete={categories.length > 0}
          links={[{ href: "/admin/categories", label: `Manage ${categories.length} categories` }]}
        />
        <StepCard
          number="03"
          title="Packages & pricing"
          description="Create packages with a name, price, session duration, inclusions, deposit, optional add-ons and visibility."
          complete={packages.some((item) => item.active)}
          links={[{ href: "/admin/packages", label: `Manage ${packages.length} packages` }]}
        />
        <StepCard
          number="04"
          title="Payments & policies"
          description="Choose checkout methods, deposit amount and bank instructions. Set refund and cancellation policies before publishing."
          complete={paymentsReady}
          links={[
            { href: "/admin/settings", label: "Payment methods & refunds" },
            { href: "/admin/general", label: "Cancellation policy" },
          ]}
        />
        <StepCard
          number="05"
          title="Website content"
          description="Change the logo, homepage text and photography, About story, testimonials, FAQs, featured work and announcement bar."
          complete={contentReady}
          links={[{ href: "/admin/content", label: "Edit website content" }]}
        />
        <StepCard
          number="06"
          title="Admin access"
          description="Create separate owner and second-admin accounts. Only the two listed email addresses will be able to access the dashboard."
          complete={accessReady}
        >
          <AdminAccessManager setupComplete={accessReady} />
        </StepCard>
      </div>
    </div>
  );
}
