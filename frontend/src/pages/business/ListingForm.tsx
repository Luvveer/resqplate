import { useState, type FormEvent } from "react";
import type { CreateListingInput, UpdateListingInput } from "@resqplate/shared";

type ListingFormValues = {
  title: string;
  description: string;
  category: string;
  quantityAvailable: string;
  pickupStart: string;
  pickupEnd: string;
  pickupCode: string;
  addressSnapShot: string;
  latitude: string;
  longitude: string;
  storageNote: string;
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
  onSubmit: (input: CreateListingInput | UpdateListingInput) => Promise<void>;
}

function toDatetimeLocalValue(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
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
    pickupCode: initialValues?.pickupCode ?? "",
    addressSnapShot: initialValues?.addressSnapShot ?? "",
    latitude: initialValues?.latitude ?? "",
    longitude: initialValues?.longitude ?? "",
    storageNote: initialValues?.storageNote ?? "",
  });

  function updateField(name: keyof ListingFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      title: values.title,
      description: values.description || undefined,
      category: values.category || undefined,
      quantityAvailable: Number(values.quantityAvailable),
      pickupStart: new Date(values.pickupStart),
      pickupEnd: new Date(values.pickupEnd),
      pickupCode: values.pickupCode || undefined,
      addressSnapShot: values.addressSnapShot || undefined,
      latitude: values.latitude || undefined,
      longitude: values.longitude || undefined,
      storageNote: values.storageNote || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="listing-title">Title</label>
        <input
          id="listing-title"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="listing-description">Description</label>
        <textarea
          id="listing-description"
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="listing-category">Category</label>
        <input
          id="listing-category"
          value={values.category}
          onChange={(event) => updateField("category", event.target.value)}
        />
      </div>

      <div>
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

      <div>
        <label htmlFor="listing-pickup-start">Pickup start</label>
        <input
          id="listing-pickup-start"
          type="datetime-local"
          value={values.pickupStart}
          onChange={(event) => updateField("pickupStart", event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="listing-pickup-end">Pickup end</label>
        <input
          id="listing-pickup-end"
          type="datetime-local"
          value={values.pickupEnd}
          onChange={(event) => updateField("pickupEnd", event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="listing-pickup-code">Pickup code</label>
        <input
          id="listing-pickup-code"
          value={values.pickupCode}
          onChange={(event) => updateField("pickupCode", event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="listing-address">Pickup address</label>
        <input
          id="listing-address"
          value={values.addressSnapShot}
          onChange={(event) =>
            updateField("addressSnapShot", event.target.value)
          }
        />
      </div>

      <div>
        <label htmlFor="listing-latitude">Latitude</label>
        <input
          id="listing-latitude"
          value={values.latitude}
          onChange={(event) => updateField("latitude", event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="listing-longitude">Longitude</label>
        <input
          id="listing-longitude"
          value={values.longitude}
          onChange={(event) => updateField("longitude", event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="listing-storage-note">Storage note</label>
        <input
          id="listing-storage-note"
          value={values.storageNote}
          onChange={(event) => updateField("storageNote", event.target.value)}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
