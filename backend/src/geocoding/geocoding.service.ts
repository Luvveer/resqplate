type GoogleGeocodingResponse = {
  results?: GoogleGeocodingResult[];
};

type GoogleGeocodingResult = {
  formattedAddress?: string;
  placeId?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type GoogleApiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export type GeocodedAddress = {
  latitude: string;
  longitude: string;
  formattedAddress: string;
  placeId: string | null;
};

export async function geocodeAddress(
  address: string,
): Promise<GeocodedAddress> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  if (!apiKey) {
    throw new Error("Google Geocoding API key is not configured.");
  }
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    throw new Error("Address is required");
  }

  const encodedAddress = encodeURIComponent(trimmedAddress);

  const url =
    `https://geocode.googleapis.com/v4/geocode/address/${encodedAddress}` +
    "?regionCode=CA";

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "results.location,results.formattedAddress,results.placeId",
      },
    });
  } catch {
    throw new Error("Could not connect to Google Geocoding.");
  }

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as GoogleApiErrorResponse | null;

    const googleMessage = errorBody?.error?.message;

    if (response.status === 400) {
      throw new Error(googleMessage ?? "Restaurant address is invalid");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(googleMessage ?? "Geocoding rejected API key");
    }

    if (response.status === 429) {
      throw new Error("Geocoding API quota exceeded");
    }

    if (response.status >= 500) {
      throw new Error("Geocoding is temporarily unavailable");
    }

    throw new Error(
      googleMessage ??
        `Geocoding request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as GoogleGeocodingResponse;
  const result = data.results?.[0];

  if (!result?.location) {
    throw new Error("Restaurant address could not be found.");
  }

  const latitude = result.location.latitude;
  const longitude = result.location.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("Geocoding API returned invalid coordinates");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("Geocoding API returned invalid latitude");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Geocoding API returned invalid longitude");
  }

  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    formattedAddress: result.formattedAddress ?? trimmedAddress,
    placeId: result.placeId ?? null,
  };
}
