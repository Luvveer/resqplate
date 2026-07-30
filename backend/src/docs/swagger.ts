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

        Profile: {
          type: "object",
          required: [
            "id",
            "authId",
            "name",
            "role",
            "status",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            authId: { type: "string" },
            email: {
              type: "string",
              format: "email",
              example: "seeker@example.com",
            },
            name: { type: "string", example: "Luvveer Singh Lamba" },
            role: {
              type: "string",
              enum: ["FOOD_SEEKER", "BUSINESS", "ADMIN"],
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED", "DELETED"],
            },
            dietaryPreferences: {
              type: "array",
              items: { type: "string" },
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        SignupRequest: {
          type: "object",
          required: ["email", "password", "name", "role"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            name: { type: "string" },
            role: {
              type: "string",
              enum: ["FOOD_SEEKER", "BUSINESS", "ADMIN"],
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },

        PasswordResetRequest: {
          type: "object",
          required: ["email", "redirectTo"],
          properties: {
            email: { type: "string", format: "email" },
            redirectTo: {
              type: "string",
              description:
                "The link where the user should be taken to reset password",
            },
          },
        },

        PasswordResetConfirmRequest: {
          type: "object",
          required: ["newPassword", "token"],
          properties: {
            newPassword: { type: "string", minLength: 8 },
            token: {
              type: "string",
              description:
                "Token required to verify the user trying to reset password",
            },
          },
        },

        UpdateProfileRequest: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            dietaryPreferences: {
              type: "array",
              items: { type: "string", maxLength: 60 },
              maxItems: 30,
            },
          },
        },

        Allergen: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Peanut" },
          },
        },

        ListingStatus: {
          type: "string",
          enum: ["AVAILABLE", "RESERVED", "EXPIRED"],
        },

        RestaurantSummary: {
          type: "object",
          required: ["id", "businessName", "address", "city", "province"],
          properties: {
            id: { type: "string", format: "uuid" },
            businessName: { type: "string", example: "Tiffin Wala" },
            address: { type: "string", example: "2086 Meadowood Park" },
            city: { type: "string", example: "Burnaby" },
            province: { type: "string", example: "British Columbia" },
            latitude: { type: "string", nullable: true, example: "49.282700" },
            longitude: {
              type: "string",
              nullable: true,
              example: "-123.940000",
            },
          },
        },

        FoodListing: {
          type: "object",
          required: [
            "id",
            "restaurantId",
            "title",
            "quantityAvailable",
            "pickupStart",
            "pickupEnd",
            "status",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            restaurantId: { type: "string", format: "uuid" },
            title: { type: "string", example: "Assorted bagels" },
            description: { type: "string", nullable: true },
            imagePath: { type: "string", nullable: true },
            category: { type: "string", nullable: true, example: "Bakery" },
            quantityAvailable: { type: "integer", example: 3 },
            pickupStart: { type: "string", format: "date-time" },
            pickupEnd: { type: "string", format: "date-time" },
            status: { $ref: "#/components/schemas/ListingStatus" },
            addressSnapShot: {
              type: "string",
              nullable: true,
              example: "2086 Meadowood Park, Burnaby, British Columbia",
            },
            latitude: { type: "string", nullable: true, example: "49.282700" },
            longitude: {
              type: "string",
              nullable: true,
              example: "-122.940000",
            },
            storageNote: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            allergens: {
              type: "array",
              items: { $ref: "#/components/schemas/Allergen" },
            },
          },
        },

        PublicListing: {
          allOf: [
            { $ref: "#/components/schemas/FoodListing" },
            {
              type: "object",
              properties: {
                restaurant: {
                  nullable: true,
                  allOf: [{ $ref: "#/components/schemas/RestaurantSummary" }],
                },
                distanceKm: {
                  type: "number",
                  nullable: true,
                  description:
                    "Distance in km from the seeker's origin. Present only when lat/lng are supplied.",
                  example: 2.4,
                },
              },
            },
          ],
        },

        CreateReservationInput: {
          type: "object",
          required: ["listingId", "pickupSlotStart"],
          properties: {
            listingId: { type: "string", format: "uuid" },
            pickupSlotStart: {
              type: "string",
              format: "date-time",
              description:
                "Start of the chosen one-hour pickup slot. Must align to a generated slot boundary.",
            },
          },
        },

        ReservationWithListing: {
          allOf: [
            { $ref: "#/components/schemas/Reservation" },
            {
              type: "object",
              required: ["listing"],
              properties: {
                listing: {
                  nullable: true,
                  allOf: [{ $ref: "#/components/schemas/FoodListing" }],
                },
              },
            },
          ],
        },
      },
    },
  },
  apis: ["./src/**/*.routes.ts"],
});
