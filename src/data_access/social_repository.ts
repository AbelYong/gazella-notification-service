import { eq } from "drizzle-orm"
import { DbClient } from "../drizzle/db.js"
import { SocialNotifications } from "../drizzle/schema.js"
import { NewFollowerInput } from "../schemas/social_schema.js"
import { DbError } from "./db_error.js"

export class SocialRepository {
    constructor(private readonly db: DbClient) {}

    async storeNewFollowerNotification(message: NewFollowerInput) {
        try {
            const [insertedNotification] = await this.db.insert(SocialNotifications).values({
                addresseeId: message.followedId,
                messageBody: JSON.stringify(message)
            }).returning();

            return insertedNotification;
        } catch (error) {
            const message = "Failed to save new follower notification"
            console.error(message, error);
            throw new DbError(error, message);
        }
    }

    async getUnreadNotifications(addresseId: string) {
        return await this.db.query.SocialNotifications.findMany({
            where: { addresseeId: addresseId, markedAsRead: false }
        });
    }

    async markNotificationAsRead(notificationId: string) {
        const [notification] = await this.db.update(SocialNotifications).set({
            markedAsRead: true
        }).where(eq(SocialNotifications.id, notificationId)).returning();

        return notification;
    }
}
