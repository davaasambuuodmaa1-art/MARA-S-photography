import { AccountPanel } from "@/components/site/AccountPanel";
import { AuthForms } from "@/components/site/AuthForms";
import { Reveal } from "@/components/site/Reveal";
import { currentUser } from "@/lib/auth";
import { getUserBookings, getUserPayments, getPrivateGalleriesForEmail } from "@/lib/data";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const [user, locale] = await Promise.all([currentUser(), currentSiteLocale()]);
  const mn = locale === "mn";

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10 lg:pt-44">
        <Reveal>
          <p className="eyebrow">{mn ? "Үйлчлүүлэгчийн бүртгэл" : "Client account"}</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,5vw,3.6rem)] text-ink">{mn ? "Таны бүх зураг нэг дор" : "Your photographs, in one place"}</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-smoke">
            {mn
              ? "Захиалга, төлбөрийн түүх болон баримтаа харахын тулд нэвтрэх эсвэл захиалга хийхдээ ашигласан имэйлээр бүртгэл үүсгэнэ үү."
              : "Sign in to see your bookings, payment history and receipts — or create an account with the same email you booked with."}
          </p>
        </Reveal>
        <div className="mt-12">
          <AuthForms />
        </div>
      </section>
    );
  }

  const [bookings, payments, galleries] = await Promise.all([
    getUserBookings(user.id),
    getUserPayments(user.id),
    getPrivateGalleriesForEmail(user.email),
  ]);

  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">{mn ? "Үйлчлүүлэгчийн бүртгэл" : "Client account"}</p>
        <h1 className="display mt-3 text-[clamp(2.2rem,4.6vw,3.4rem)] text-ink">{mn ? `Тавтай морил, ${user.name.split(" ")[0]}` : `Welcome back, ${user.name.split(" ")[0]}`}</h1>
      </Reveal>
      <div className="mt-12">
        <AccountPanel
          user={{ name: user.name, email: user.email, phone: user.phone, created_at: user.created_at }}
          bookings={bookings.map((b) => ({
            id: b.id,
            code: b.code,
            date: b.date,
            time_slot: b.time_slot,
            status: b.status,
            payment_status: b.payment_status,
            amount: b.amount,
            deposit_amount: b.deposit_amount,
            category_name: b.category_name ?? null,
            package_name: b.package_name ?? null,
          }))}
          payments={payments.map((p) => ({
            id: p.id,
            code: p.code,
            gross_amount: p.gross_amount,
            kind: p.kind,
            status: p.status,
            created_at: p.created_at,
          }))}
        />
      </div>

      {galleries.length ? (
        <div className="mt-14">
          <p className="eyebrow">{mn ? "Хувийн галерей" : "Private galleries"}</p>
          <h2 className="display mt-3 text-2xl">{mn ? "Таны зургууд" : "Your photographs"}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery) => {
              let cover = "";
              try {
                const parsed = JSON.parse(gallery.images);
                if (Array.isArray(parsed) && parsed.length) cover = String(parsed[0]);
              } catch {
                cover = "";
              }
              return (
                <a
                  key={gallery.id}
                  href={`/gallery/${gallery.token}`}
                  className="group overflow-hidden border border-ink/10 bg-white/70"
                >
                  <div className="aspect-[4/3] bg-sand">
                    {cover ? <img src={cover} alt={gallery.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : null}
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-lg">{gallery.title}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-smoke">
                      {JSON.parse(gallery.images).length} {mn ? "зураг" : `photograph${JSON.parse(gallery.images).length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
