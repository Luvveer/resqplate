export type VerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "INFO_REQUESTED";

export interface AdminRestaurantProfile {
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
  verificationStatus: VerificationStatus;
  adminNotes: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateRestaurantVerification {
  verificationStatus: VerificationStatus;
  adminNotes?: string | null | undefined;
  verifiedAt?: Date | null | undefined;
  updatedAt?: Date | undefined;
}
