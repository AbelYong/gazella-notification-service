ALTER TABLE "article_notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "article_notifications" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "project_notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_notifications" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "social_notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "social_notifications" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "notification_types";--> statement-breakpoint
CREATE TYPE "notification_types" AS ENUM('socials', 'articles', 'projects');--> statement-breakpoint
ALTER TABLE "article_notifications" ALTER COLUMN "type" SET DATA TYPE "notification_types" USING "type"::"notification_types";--> statement-breakpoint
ALTER TABLE "article_notifications" ALTER COLUMN "type" SET DEFAULT 'articles'::"notification_types";--> statement-breakpoint
ALTER TABLE "project_notifications" ALTER COLUMN "type" SET DATA TYPE "notification_types" USING "type"::"notification_types";--> statement-breakpoint
ALTER TABLE "project_notifications" ALTER COLUMN "type" SET DEFAULT 'projects'::"notification_types";--> statement-breakpoint
ALTER TABLE "social_notifications" ALTER COLUMN "type" SET DATA TYPE "notification_types" USING "type"::"notification_types";--> statement-breakpoint
ALTER TABLE "social_notifications" ALTER COLUMN "type" SET DEFAULT 'socials'::"notification_types";