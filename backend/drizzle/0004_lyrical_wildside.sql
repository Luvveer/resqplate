ALTER TABLE "restaurant_profiles" ADD COLUMN "postal_code" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "food_listings" DROP COLUMN "pickup_code";