import { cookies } from "next/headers";
import { getSiteLocale, SITE_LOCALE_COOKIE } from "@/lib/site-locale";

export async function currentSiteLocale() {
  const cookieStore = await cookies();
  return getSiteLocale(cookieStore.get(SITE_LOCALE_COOKIE)?.value);
}
