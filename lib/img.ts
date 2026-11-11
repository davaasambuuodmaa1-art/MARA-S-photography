/** Adds responsive width parameters to remote photo URLs; local uploads pass through. */
export function sizedImage(url: string | null | undefined, width = 1200) {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    return `${url}&w=${width}`;
  }
  return url;
}

export function downloadUrl(imageId: string) {
  return `/api/download/${imageId}`;
}
