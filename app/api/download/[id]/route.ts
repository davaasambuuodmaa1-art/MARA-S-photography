import { first, getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await first<{
    id: string;
    url: string;
    storage_key: string | null;
    downloadable: number | null;
    title: string;
    downloads: number;
  }>(
    `SELECT i.id, i.url, i.storage_key, i.downloadable, i.title, c.downloads
     FROM images i JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?`,
    [id],
  );
  if (!image) return new Response("Not found", { status: 404 });
  const allowed = Boolean(image.downloads) && image.downloadable !== 0;
  if (!allowed) {
    return new Response("Downloads are disabled for this photograph.", { status: 403 });
  }

  const filename = `${(image.title || "photograph").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;

  if (image.storage_key) {
    const env = await getEnv();
    const object = env.FILES ? await env.FILES.get(image.storage_key) : null;
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  return Response.redirect(image.url, 302);
}
