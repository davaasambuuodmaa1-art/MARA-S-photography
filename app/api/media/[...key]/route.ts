import { getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");
  const env = await getEnv();
  if (!env.FILES) {
    return new Response("Storage is not configured.", { status: 503 });
  }
  const object = await env.FILES.get(objectKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  const url = new URL(request.url);
  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (url.searchParams.get("download")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${objectKey.split("/").pop() ?? "photograph.jpg"}"`,
    );
  }
  return new Response(object.body, { headers });
}
