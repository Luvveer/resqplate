import { useState, type FormEvent, useEffect } from "react";
import type {
  CreateListingInput,
  UpdateListingInput,
  AllergenResponse,
} from "@resqplate/shared";
import { listingsApi } from "../../api/listings";

type ListingFormValues = {
  title: string;
  description: string;
  category: string;
  quantityAvailable: string;
  pickupStart: string;
  pickupEnd: string;
  storageNote: string;
  allergenIds: string[];
};

type ListingFormInitialValues = Omit<
  ListingFormValues,
  "pickupStart" | "pickupEnd"
> & {
  pickupStart: string | Date;
  pickupEnd: string | Date;
};

interface ListingFormProps {
  initialValues?: Partial<ListingFormInitialValues>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (
    input: CreateListingInput | UpdateListingInput,
    imageFile: File | null,
  ) => Promise<void>;
}

function toLocalDatetimeValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toDatetimeLocalValue(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return toLocalDatetimeValue(date);
}

function getMaxPickupEnd(pickupStart: string) {
  if (!pickupStart) {
    return undefined;
  }
  const start = new Date(pickupStart);

  if (Number.isNaN(start.getTime())) {
    return undefined;
  }

  const maxEndtime = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return toLocalDatetimeValue(maxEndtime);
}

export function ListingForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: ListingFormProps) {
  const [values, setValues] = useState<ListingFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    category: initialValues?.category ?? "",
    quantityAvailable: initialValues?.quantityAvailable ?? "1",
    pickupStart: toDatetimeLocalValue(initialValues?.pickupStart),
    pickupEnd: toDatetimeLocalValue(initialValues?.pickupEnd),
    storageNote: initialValues?.storageNote ?? "",
    allergenIds: initialValues?.allergenIds ?? [],
  });

  const [allergenOptions, setAllergenOptions] = useState<AllergenResponse[]>(
    [],
  );
  const [allergenError, setAllergenError] = useState<string | null>(null);
  const [areAllergenLoading, setAreAllergenLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    let current = true;

    async function loadAllergens() {
      try {
        const answer = await listingsApi.getAllergens();

        if (current) {
          setAllergenOptions(answer.allergens);
        }
      } catch (error) {
        if (current) {
          setAllergenError(
            error instanceof Error ? error.message : "Failed to load allergen",
          );
        }
      } finally {
        if (current) {
          setAreAllergenLoading(false);
        }
      }
    }
    void loadAllergens();

    return () => {
      current = false;
    };
  }, []);

  function updateField(name: keyof ListingFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit(
      {
        title: values.title,
        description: values.description || undefined,
        category: values.category || undefined,
        quantityAvailable: Number(values.quantityAvailable),
        pickupStart: new Date(values.pickupStart),
        pickupEnd: new Date(values.pickupEnd),
        storageNote: values.storageNote || undefined,
        allergenIds: values.allergenIds,
      },
      imageFile,
    );
  }

  function AllergenToogle(allergenId: string) {
    setValues((current) => {
      const selected = current.allergenIds.includes(allergenId);

      return {
        ...current,
        allergenIds: selected
          ? current.allergenIds.filter((id) => id !== allergenId)
          : [...current.allergenIds, allergenId],
      };
    });
  }

  return (
    <form className="business-form" onSubmit={handleSubmit}>
      <div className="business-field">
        <label htmlFor="listing-title">Title</label>
        <input
          id="listing-title"
          placeholder="e.g. Assorted Bread Loaves"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
          required
        />
      </div>

      <div className="business-field">
        <label htmlFor="listing-description">Description</label>
        <textarea
          id="listing-description"
          placeholder="Briefly describe the food and its condition."
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>

      <div className="business-form-grid-image">
        <div className="business-field">
          <label htmlFor="listing-image">Food Image</label>
          <div className="business-upload-box">
            <input
              id="listing-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] ?? null);
              }}
            />

            <p className="business-field-help">
              Optional, JPEG, PNG or Webp and Maximum 5 MB.
            </p>
          </div>
        </div>

        <div className="business-field">
          <label htmlFor="listing-category">Category</label>
          <input
            id="listing-category"
            value={values.category}
            onChange={(event) => updateField("category", event.target.value)}
          />
        </div>
      </div>

      <fieldset className="business-allergen-panel">
        <legend>Contains allergen</legend>

        <p className="business-field-help">
          Select allergen contained in this food
        </p>
        {areAllergenLoading && (
          <p className="business-message">Loading allergen...</p>
        )}

        {allergenError && <p className="business-error">{allergenError}</p>}

        {!areAllergenLoading && !allergenError && (
          <div className="business-allergen-options">
            {allergenOptions.map((allergen) => (
              <label key={allergen.id} className="business-allergen-option">
                <input
                  type="checkbox"
                  checked={values.allergenIds.includes(allergen.id)}
                  onChange={() => AllergenToogle(allergen.id)}
                />
                <span>{allergen.name}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <div className="business-form-grid-3">
        <div className="business-field">
          <label htmlFor="listing-quantity">Quantity</label>
          <input
            id="listing-quantity"
            type="number"
            min="1"
            value={values.quantityAvailable}
            onChange={(event) =>
              updateField("quantityAvailable", event.target.value)
            }
            required
          />
        </div>

        <div className="business-field">
          <label htmlFor="listing-pickup-start">Pickup start</label>
          <input
            id="listing-pickup-start"
            type="datetime-local"
            value={values.pickupStart}
            onChange={(event) => updateField("pickupStart", event.target.value)}
            required
          />
        </div>

        <div className="business-field">
          <label htmlFor="listing-pickup-end">Pickup end</label>
          <input
            id="listing-pickup-end"
            type="datetime-local"
            value={values.pickupEnd}
            min={values.pickupStart || undefined}
            max={getMaxPickupEnd(values.pickupStart)}
            onChange={(event) => updateField("pickupEnd", event.target.value)}
            required
          />
        </div>
      </div>

      <div className="business-field business-field-full">
        <label htmlFor="listing-storage-note">Storage notes</label>
        <input
          id="listing-storage-note"
          value={values.storageNote}
          placeholder="e.g. Keep refrigerated until pickup"
          onChange={(event) => updateField("storageNote", event.target.value)}
        />
      </div>

      <div className="business-form-footer">
        <button
          className="business-button primary-dark"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
