import type { AddressSuggestion } from "@resqplate/shared";

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: {
        text?: string;
      };
    };
  }>;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type PlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type GoogleErrorResponse = {
  error?: {
    message?: string;
  };
};

export type ResolvedPlaceAddress = {
  googlePlaceId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: string;
  longitude: string;
};

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("Google Places API key is not configured");
  }

  return apiKey;
}

async function getGoogleError(res: Response): Promise<string | null> {
  const body = (await res
    .json()
    .catch(() => null)) as GoogleErrorResponse | null;

  return body?.error?.message ?? null;
}

export async function autocompleteAddress(
  input: string,
  sessionToken: string,
): Promise<AddressSuggestion[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId," +
          "suggestions.placePrediction.text.text",
      },

      body: JSON.stringify({
        input,
        sessionToken,
        includedRegionCodes: ["ca"],
        includeQueryPredictions: false,
      }),
    },
  );

  if (!response.ok) {
    const googleMessage = await getGoogleError(response);

    if (response.status === 429) {
      throw new Error("API Place search quota exceeded");
    }

    throw new Error(googleMessage ?? "Address suggestion are unavailable");
  }

  const data = (await response.json()) as AutocompleteResponse;

  return (data.suggestions ?? [])
    .map((suggestion) => {
      const prediction = suggestion.placePrediction;

      if (!prediction?.placeId || !prediction.text?.text) {
        return null;
      }

      return {
        placeId: prediction.placeId,
        description: prediction.text.text,
      };
    })
    .filter(
      (suggestion): suggestion is AddressSuggestion => suggestion != null,
    );
}

function findComponent(
  components: AddressComponent[],
  type: string,
): AddressComponent | undefined {
  return components.find((component) => component.types?.includes(type));
}

export async function resolveAddress(
  placeId: string,
  sessionToken: string,
): Promise<ResolvedPlaceAddress> {
  const encodedPlaceId = encodeURIComponent(placeId);
  const encodedSessionToken = encodeURIComponent(sessionToken);

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodedPlaceId}` +
      `?sessionToken=${encodedSessionToken}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": "id,formattedAddress,addressComponents,location",
      },
    },
  );

  if (!response.ok) {
    const googleMessage = await getGoogleError(response);

    if (response.status === 429) {
      throw new Error("API Place search quota exceeded");
    }

    throw new Error(googleMessage ?? "Selected address con not be verified");
  }

  const place = (await response.json()) as PlaceDetailsResponse;
  const components = place.addressComponents ?? [];

  const country = findComponent(components, "country")?.shortText;

  if (country !== "CA") {
    throw new Error("Address must be in Canada");
  }

  const streetNumber =
    findComponent(components, "street_number")?.longText ?? "";
  const route = findComponent(components, "route")?.longText ?? "";
  const subpremise = findComponent(components, "subpremise")?.longText ?? "";
  const city =
    findComponent(components, "locality")?.longText ??
    findComponent(components, "postal_town")?.longText ??
    findComponent(components, "administrative_area_level_3")?.longText ??
    "";
  const province =
    findComponent(components, "administrative_area_level_1")?.longText ?? "";
  const postalCode = findComponent(components, "postal_code")?.longText ?? "";

  const streetAddress = [subpremise, streetNumber, route]
    .filter(Boolean)
    .join(" ");

  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (!streetAddress || !city || !province || !postalCode) {
    throw new Error("Please select complete street address with postal code");
  }

  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("Google did not return coordinates");
  }

  return {
    googlePlaceId: place.id ?? placeId,
    address: streetAddress,
    city,
    province,
    postalCode,
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
  };
}
