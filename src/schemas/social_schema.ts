import { z } from "zod";

export const NewFollowerSchema = z.object({
    followedId: z.uuidv4(),
    newFollowerId: z.uuidv4(),
    newFollowerName: z.string(),
    newFollowerPfpUri: z.url().optional()
});

export type NewFollowerInput = z.infer<typeof NewFollowerSchema>;
