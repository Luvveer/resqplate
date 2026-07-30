import { useEffect, useState } from "react";
import type { AddressSuggestion } from "@resqplate/shared";
import { companyApi } from "../../api/restaurant";

type AddressAutocompleteProps = {
  sessionToken: string;
  selectedPlaceId: string;
  required?: boolean;
  onSelect: (placeId: string, description: string) => void;
};

export function AddressAutocomplete({
  sessionToken,
  selectedPlaceId,
  required = false,
  onSelect,
}: AddressAutocompleteProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (input.trim().length < 3 || selectedPlaceId) {
      return;
    }

    let cancel = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await companyApi.getAddressSuggestions({
          input: input.trim(),
          sessionToken,
        });

        if (!cancel) {
          setSuggestions(result.suggestions);
        }
      } catch (error) {
        if (!cancel) {
          setError(
            error instanceof Error ? error.message : "Failed to search address",
          );
        }
      } finally {
        if (!cancel) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      cancel = true;
      window.clearTimeout(timeoutId);
    };
  }, [input, selectedPlaceId, sessionToken]);

  return (
    <div className="address-autocomplete">
      <label htmlFor="restaurant-address">Restaurant address</label>
      <input
        id="restaurant-address"
        value={input}
        autoComplete="off"
        placeholder="Start typing your address"
        required={required}
        onChange={(event) => {
          const newValue = event.target.value;

          setInput(newValue);
          setSuggestions([]);
          setError(null);
          setIsLoading(false);

          if (selectedPlaceId) {
            onSelect("", "");
          }
        }}
      />
      {isLoading && (
        <p className="business-field-help">Searching address....</p>
      )}
      {error && <p className="business-error">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => {
                  setInput(suggestion.description);
                  setSuggestions([]);

                  onSelect(suggestion.placeId, suggestion.description);
                }}
              >
                {suggestion.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
