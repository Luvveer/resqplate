import swaggerJsdoc from "swagger-jsdoc";

export const openApiDocument = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",

    info: {
      title: "ResQPlate API",
      version: "1.0.0",
      description:
        "API documentation for ResQPlate restaurant onboarding, food listings, administration, reservations, and pickups.",
    },

    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Better Auth session cookie.",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "string",
              example: "Restaurant profile not found",
            },
          },
        },

        VerificationStatus: {
          type: "string",
          enum: [
            "PENDING",
            "APPROVED",
            "REJECTED",
            "SUSPENDED",
            "INFO_REQUESTED",
          ],
        },

        AdminVerificationAction: {
          type: "object",
          properties: {
            adminNotes: {
              type: "string",
              example: "Restaurant documents have been verified.",
            },
          },
        },

        Restaurant: {
          type: "object",
          required: [
            "id",
            "profileId",
            "businessName",
            "address",
            "city",
            "province",
            "postalCode",
            "verificationStatus",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            profileId: {
              type: "string",
              format: "uuid",
            },
            businessName: {
              type: "string",
              example: "Tiffin Wala",
            },
            address: {
              type: "string",
              example: "2086 Meadowood Park",
            },
            city: {
              type: "string",
              example: "Burnaby",
            },
            province: {
              type: "string",
              example: "British Columbia",
            },
            postalCode: {
              type: "string",
              example: "V5A 4G2",
            },
            phone: {
              type: "string",
              nullable: true,
              example: "7782843310",
            },
            description: {
              type: "string",
              nullable: true,
            },
            latitude: {
              type: "string",
              nullable: true,
              example: "49.282700",
            },
            longitude: {
              type: "string",
              nullable: true,
              example: "-122.940000",
            },
            verificationStatus: {
              $ref: "#/components/schemas/VerificationStatus",
            },
            adminNotes: {
              type: "string",
              nullable: true,
            },
            verifiedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Reservation: {
          type: "object",
          required: [
            "id",
            "profileId",
            "listingId",
            "status",
            "reservedAt",
            "pickupSlotStart",
            "pickupSlotEnd",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            profileId: { type: "string", format: "uuid" },
            listingId: { type: "string", format: "uuid" },
            pickupCodeDisplay: {
              type: "string",
              nullable: true,
              example: "X7MQR2",
            },
            status: {
              $ref: "#/components/schemas/ReservationStatus",
            },
            reservedAt: { type: "string", format: "date-time" },
            pickedUpAt: { type: "string", format: "date-time", nullable: true },
            cancelledAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            noShowAt: { type: "string", format: "date-time", nullable: true },
            pickupSlotStart: { type: "string", format: "date-time" },
            pickupSlotEnd: { type: "string", format: "date-time" },
          },
        },

        ReservationStatus: {
          type: "string",
          enum: ["RESERVED", "PICKED_UP", "CANCELLED", "EXPIRED", "NO_SHOW"],
        },

        ConfirmPickupInput: {
          type: "object",
          required: ["pickupCode"],
          properties: {
            pickupCode: {
              type: "string",
              example: "X7MQR2",
            },
          },
        },
      },
    },
  },
  apis: ["./src/**/*.routes.ts"],
});
