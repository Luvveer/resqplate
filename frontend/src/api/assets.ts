import { API_URL } from "./apiClient";

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
