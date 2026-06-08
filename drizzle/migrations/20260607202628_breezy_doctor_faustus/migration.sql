CREATE TABLE "article_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"addressee_id" uuid NOT NULL,
	"message_body" jsonb NOT NULL,
	"marked_as_read" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"addressee_id" uuid NOT NULL,
	"message_body" jsonb NOT NULL,
	"marked_as_read" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"addressee_id" uuid NOT NULL,
	"message_body" jsonb NOT NULL,
	"marked_as_read" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
