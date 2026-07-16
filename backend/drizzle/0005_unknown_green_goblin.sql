ALTER TABLE "reservations" ADD COLUMN "pickup_slot_start" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "pickup_slot_end" timestamp NOT NULL;