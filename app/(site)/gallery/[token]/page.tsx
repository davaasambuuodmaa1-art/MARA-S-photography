import { notFound } from "next/navigation";
import { getPrivateGalleryByToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PrivateGalleryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const gallery = await getPrivateGalleryByToken(token);
  if (!gallery) notFound();

  let images: string[] = [];
  try {
    const parsed = JSON.parse(gallery.images);
    if (Array.isArray(parsed)) images = parsed.map(String);
  } catch {
    images = [];
  }

  const expired = gallery.expires_at && new Date(gallery.expires_at) < new Date();
  const live = Boolean(gallery.published) && !expired;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Private gallery</p>
        <h1 className="display mt-2 text-4xl">{gallery.title}</h1>
        {gallery.customer_name ? (
          <p className="mt-2 text-sm text-smoke">For {gallery.customer_name}</p>
        ) : null}
        {gallery.note ? <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-smoke">{gallery.note}</p> : null}
      </header>

      {!live ? (
        <div className="border border-ink/12 bg-white/70 p-8 text-center">
          <p className="font-serif text-2xl">
            {expired ? "This gallery has expired" : "This gallery is not available yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-smoke">
            {expired
              ? "The viewing window for this gallery has closed. Contact Mara to request access again."
              : "The photographs are being prepared. You will receive the private link once they are ready."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-smoke">
            <span>{images.length} photograph{images.length === 1 ? "" : "s"}</span>
            {gallery.downloads ? (
              <span>Downloads enabled</span>
            ) : (
              <span>Viewing only — downloads disabled</span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((url, index) => (
              <figure key={url} className="group relative overflow-hidden bg-sand">
                <img src={url} alt={`${gallery.title} ${index + 1}`} className="h-full w-full object-cover" />
                {gallery.downloads ? (
                  <a
                    href={url}
                    download
                    className="absolute bottom-2 right-2 border border-white/40 bg-ink/70 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-cream opacity-0 transition group-hover:opacity-100"
                  >
                    Download
                  </a>
                ) : null}
              </figure>
            ))}
          </div>
          {gallery.expires_at ? (
            <p className="mt-6 text-[10px] text-smoke/70">
              Available until {new Date(gallery.expires_at).toLocaleDateString("en-AU")}.
            </p>
          ) : null}
        </>
      )}
    </main>
  );
}
