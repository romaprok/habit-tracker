CREATE TABLE "habit_checks" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habit_checks_habit_id_date_unique" UNIQUE("habit_id","date")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_checks" ADD CONSTRAINT "habit_checks_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;