CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_accounts_provider_user_unique" UNIQUE("provider","provider_user_id"),
	CONSTRAINT "oauth_accounts_user_provider_unique" UNIQUE("user_id","provider"),
	CONSTRAINT "oauth_accounts_provider_known" CHECK ("oauth_accounts"."provider" in ('github'))
);
--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;