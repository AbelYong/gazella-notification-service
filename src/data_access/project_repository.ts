import { eq } from "drizzle-orm"
import { DbClient } from "../drizzle/db.js"
import { ProjectNotifications } from "../drizzle/schema.js"
import { DbError } from "./db_error.js"
import { NewEnrollmentInput, EnrollmentCancelledInput, ProjectAboutToBeginInput, ProjectFullInput } from "../schemas/project_schema.js"

export class ProjectRepository {
    constructor(private readonly db: DbClient) {}

    async storeNewEnrollmentNotification(message: NewEnrollmentInput) {
        return await this.storeNotification(message.organizerId, message, "new enrollment");
    }

    async storeEnrollmentCancelledNotification(message: EnrollmentCancelledInput) {
        return await this.storeNotification(message.organizerId, message, "enrollment cancelled");
    }

    async storeProjectAboutToBeginNotification(message: ProjectAboutToBeginInput) {
        return await this.storeNotification(message.volunteerId, message, "project about to begin");
    }

    async storeProjectFullNotification(message: ProjectFullInput) {
        return await this.storeNotification(message.organizerId, message, "project full");
    }

    private async storeNotification(addresseId: string, message: unknown, notificationName: string) {
        try {
            const [insertedNotification] = await this.db.insert(ProjectNotifications).values({
                addresseeId: addresseId,
                messageBody: JSON.stringify(message)
            }).returning();
        
            return insertedNotification;
        } catch (error) {
            const message = `Failed to save ${notificationName} notification`;
            console.error(message, error);
            throw new DbError(error, message);
        }
    }

    async getUnreadNotifications(addresseId: string) {
        return await this.db.query.ProjectNotifications.findMany({
            where: { addresseeId: addresseId, markedAsRead: false }
        });
    }

    async markNotificationAsRead(notificationId: string) {
        const [notification] = await this.db.update(ProjectNotifications).set({
            markedAsRead: true
        }).where(eq(ProjectNotifications.id, notificationId)).returning();

        return notification;
    }
}
