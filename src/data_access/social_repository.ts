import { eq } from "drizzle-orm"
import { DbClient } from "../drizzle/db.js"
import { SocialNotifications } from "../drizzle/schema.js"
import { NewFollowerInput } from "../schemas/social_schema.js"

export class SocialRepository {
    constructor(private readonly db: DbClient) {}

    async storeNewFollowerNotification(message: NewFollowerInput) {
        await this.db.insert(SocialNotifications).values({
            addresseeId: message.followedId,
            messageBody: JSON.stringify(message)
        });
    }

    async getUnreadNotifications(addresseId: string) {
        return await this.db.query.SocialNotifications.findMany({
            where: { addresseeId: addresseId, markedAsRead: false }
        });
    }

    async markNotificationAsRead(notificationId: string) {
        return await this.db.update(SocialNotifications).set({
            markedAsRead: true
        }).where(eq(SocialNotifications.id, notificationId));
    }
}
