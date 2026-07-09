CREATE TYPE "public"."listing_status" AS ENUM('AVAILABLE', 'RESERVED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('UNSAFE_FOOD', 'MISSING_ALLERGEN', 'WRONG_QUALITY', 'NOT_AVAILABLE', 'BAD_PICKUP_EXPERIENCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."report_severity" AS ENUM('LOW', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('RESERVED', 'PICKED_UP', 'CANCELLED', 'EXPIRED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INFO_REQUESTED');--> statement-breakpoint
CREATE TABLE "allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "allergens_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "food_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"quantity_available" integer NOT NULL,
	"pickup_start" timestamp NOT NULL,
	"pickup_end" timestamp NOT NULL,
	"pickup_code" varchar(50),
	"status" "listing_status" DEFAULT 'AVAILABLE' NOT NULL,
	"address_snapshot" text,
	"latitude" numeric(8, 6),
	"longitude" numeric(9, 6),
	"storage_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_allergens" (
	"listing_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL,
	CONSTRAINT "listing_allergens_listing_id_allergen_id_pk" PRIMARY KEY("listing_id","allergen_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"severity" "report_severity" DEFAULT 'LOW' NOT NULL,
	"status" varchar(100),
	"ai_category" varchar(255),
	"ai_suggested_action" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"pickup_code_display" varchar(50),
	"status" "reservation_status" DEFAULT 'RESERVED' NOT NULL,
	"reserved_at" timestamp DEFAULT now() NOT NULL,
	"picked_up_at" timestamp,
	"cancelled_at" timestamp,
	"no_show_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "restaurant_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"province" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"phone" varchar(30),
	"description" text,
	"latitude" numeric(8, 6),
	"longitude" numeric(9, 6),
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"admin_notes" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_profiles_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
ALTER TABLE "profile" RENAME COLUMN "authId" TO "auth_id";--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_authId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "food_listings" ADD CONSTRAINT "food_listings_restaurant_id_restaurant_profiles_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_allergens" ADD CONSTRAINT "listing_allergens_listing_id_food_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."food_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_allergens" ADD CONSTRAINT "listing_allergens_allergen_id_allergens_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profile_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_food_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."food_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_restaurant_id_restaurant_profiles_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_listing_id_food_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."food_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_profiles" ADD CONSTRAINT "restaurant_profiles_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_auth_id_user_id_fk" FOREIGN KEY ("auth_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_auth_id_unique" UNIQUE("auth_id");