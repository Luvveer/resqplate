const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const API_ORIGIN = new URL(API_URL, window.location.origin).origin;

export function getAssetUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath) {
    return null;
  }

  const normalizedpath = imagePath.replace(/^\/+/, "");

  return `${API_ORIGIN}/uploads/${normalizedpath}`;
}
