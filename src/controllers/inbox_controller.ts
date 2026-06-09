import { Request, Response } from "express"
import { InboxService } from "../services/inbox_service.js"
import { MarkAsReadInput } from "../schemas/inbox_schema.js";

export const makeGetUnreadNotificationsController = (service: InboxService) => {
    return async (req: Request, res: Response) : Promise<void> => {
        const userId = req.auth?.sub;

        if (!userId) {
            res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
            return;
        }

        const notifications = await service.getAllUnreadNotifications(userId);

        res.status(200).json(notifications);
    }
}

export const makeMarkNotificationAsReadController = (service: InboxService) => {
    return async (req: Request<MarkAsReadInput>, res: Response) : Promise<void> => {
        const typeToMark = req.params.notificationType; 

        const id = req.params.notificationId;
        if (typeToMark === "socials") {
            await service.markSocialNotificationAsRead(id);
        } else if (typeToMark === "articles") {
            await service.markArticleNotificationAsRead(id);
        } else {
            await service.markProjectNotificationAsRead(id);
        }

        res.sendStatus(200);
    }
}
