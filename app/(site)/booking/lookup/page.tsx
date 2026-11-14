import { BookingLookup } from "@/components/site/BookingLookup";
import { Reveal } from "@/components/site/Reveal";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const metadata = { title: "Check your booking" };

export default async function LookupPage() {
  const mn = (await currentSiteLocale()) === "mn";
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10 lg:pt-44">
      <Reveal>
        <p className="eyebrow">{mn ? "Захиалга шалгах" : "Booking lookup"}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,5vw,3.6rem)] text-ink">{mn ? "Миний захиалга хаана байна?" : "Where is my booking?"}</h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-smoke">
          {mn
            ? "Баталгаажуулах имэйлд ирсэн захиалгын дугаар болон захиалга хийхдээ ашигласан имэйл хаягаа оруулна уу."
            : "Enter the reference from your confirmation email together with the email address you booked with."}
        </p>
      </Reveal>
      <div className="mt-12">
        <BookingLookup />
      </div>
    </section>
  );
}
