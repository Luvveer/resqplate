export interface RestaurantProfile {
  id: string;
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string | null;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  verificationStatus:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "INFO_REQUESTED";
  adminNotes: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRestaurantProfile {
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string | null | undefined;
  description?: string | null | undefined;
  latitude?: string | null | undefined;
  longitude?: string | null | undefined;
  verificationStatus?:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "INFO_REQUESTED";
}
