CREATE TYPE "notification_types" AS ENUM('social', 'article', 'project');--> statement-breakpoint
ALTER TABLE "article_notifications" ADD COLUMN "type" "notification_types" DEFAULT 'article'::"notification_types" NOT NULL;--> statement-breakpoint
ALTER TABLE "project_notifications" ADD COLUMN "type" "notification_types" DEFAULT 'project'::"notification_types" NOT NULL;--> statement-breakpoint
ALTER TABLE "social_notifications" ADD COLUMN "type" "notification_types" DEFAULT 'social'::"notification_types" NOT NULL;