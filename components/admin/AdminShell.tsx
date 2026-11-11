"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: "M3 10.5L11 4l8 6.5V20H3z" },
  { href: "/admin/bookings", label: "Bookings", icon: "M4 5h14v15H4zM8 3v4M14 3v4M4 10h14" },
  { href: "/admin/galleries", label: "Galleries", icon: "M3 5h16v14H3zM3 15l5-4 4 3 3-2 4 3" },
  { href: "/admin/private-galleries", label: "Private galleries", icon: "M5 10l7-6 7 6v9H5zM9 19v-6h4v6" },
  { href: "/admin/calendar", label: "Calendar", icon: "M4 6h14v13H4zM8 3v5M14 3v5M4 11h14" },
  { href: "/admin/availability", label: "Availability", icon: "M4 6h14v13H4zM8 3v5M14 3v5M4 11h14" },
  { href: "/admin/locations", label: "Locations", icon: "M11 20s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11zM11 9a2 2 0 100-4 2 2 0 000 4z" },
  { href: "/admin/travel", label: "Travel & areas", icon: "M3 17h18M6 17V9l5-5 5 5v8M9 17v-4h4v4" },
  { href: "/admin/customers", label: "Customers", icon: "M8 11a3 3 0 100-6 3 3 0 000 6zM2 20c1-3.5 3.3-5 6-5s5 1.5 6 5M16 8a2.5 2.5 0 100-5M17 14c2 .6 3.2 2.4 3.8 5" },
  { href: "/admin/packages", label: "Packages", icon: "M3 8l8-4 8 4-8 4-8-4zM3 8v8l8 4 8-4V8" },
  { href: "/admin/content", label: "Website content", icon: "M4 4h14v16H4zM7 8h8M7 12h8M7 16h5" },
  { href: "/admin/inquiries", label: "Enquiries", icon: "M3 5h16v11H8l-5 4z" },
  { href: "/admin/founder", label: "Founder", icon: "M11 4a4 4 0 100 8 4 4 0 000-8zM4 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" },
  { href: "/admin/email", label: "Email", icon: "M3 6h16v12H3zM3 6l8 6 8-6" },
  { href: "/admin/general", label: "General settings", icon: "M4 4h14v16H4zM7 8h8M7 12h8M7 16h5" },
  { href: "/admin/account", label: "Account", icon: "M11 11a4 4 0 100-8 4 4 0 000 8zM4 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" },
  { href: "/admin/categories", label: "Categories", icon: "M3 5h16v14H3zM3 15l5-4 4 3 3-2 4 3" },
  { href: "/admin/settings", label: "Payments", icon: "M2 7h18v10H2zM2 11h18" },
];

export function AdminShell({
  children,
  user,
  unread,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await logoutAction();
    router.push("/admin/login");
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f6f2ea] text-ink">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-ink text-cream transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-cream/10 px-6 py-6">
          <Link href="/admin" className="block">
            <p className="display text-2xl tracking-[0.1em]">MARA&apos;S</p>
            <p className="mt-0.5 text-[7px] uppercase tracking-[0.42em] text-cream/45">Studio manager</p>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 border-l-2 px-6 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors",
                isActive(item.href)
                  ? "border-champagne bg-cream/5 text-cream"
                  : "border-transparent text-cream/50 hover:bg-cream/5 hover:text-cream",
              )}
            >
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d={item.icon} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center justify-between border-l-2 px-6 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors",
              isActive("/admin/notifications")
                ? "border-champagne bg-cream/5 text-cream"
                : "border-transparent text-cream/50 hover:bg-cream/5 hover:text-cream",
            )}
          >
            <span>Notifications</span>
            {unread ? (
              <span className="rounded-full bg-champagne px-1.5 py-0.5 text-[9px] text-ink">{unread}</span>
            ) : null}
          </Link>
        </nav>

        <div className="border-t border-cream/10 px-6 py-5">
          <p className="text-[11px] text-cream">{user.name}</p>
          <p className="truncate text-[10px] text-cream/40">{user.email}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/" className="text-[9px] uppercase tracking-[0.18em] text-cream/50 hover:text-champagne">
              View website ↗
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-left text-[9px] uppercase tracking-[0.18em] text-cream/50 hover:text-champagne"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ink/10 bg-[#f6f2ea]/95 px-5 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center border border-ink/15 lg:hidden"
          >
            <span className="flex flex-col gap-1">
              <span className="h-px w-4 bg-ink" />
              <span className="h-px w-4 bg-ink" />
              <span className="h-px w-4 bg-ink" />
            </span>
          </button>
          <p className="hidden text-[10px] uppercase tracking-[0.24em] text-smoke lg:block">
            Studio operations · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/book" className="hidden text-[10px] uppercase tracking-[0.18em] text-smoke hover:text-ink sm:block">
              New booking ↗
            </Link>
            <NotificationBell initialUnread={unread} />
          </div>
        </header>
        <main className="px-5 py-7 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
