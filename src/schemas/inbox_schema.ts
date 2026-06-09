import { z } from "zod"

export const markAsReadSchema = z.object({
    notificationType: z.enum(["socials", "articles", "projects"]),
    notificationId: z.uuidv4()
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>