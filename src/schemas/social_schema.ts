import { z } from "zod";

export const NewFollowerSchema = z.object({
    eventKey: z.enum(["NEW_FOLLOWER"]).default("NEW_FOLLOWER"),
    followedId: z.uuidv4(),
    newFollowerId: z.uuidv4(),
    newFollowerName: z.string(),
    newFollowerPfpUri: z.string().trim()
        .pipe(
            z.union([z.url(), z.literal("").transform(() => undefined)])
        ).optional()
});

export type NewFollowerInput = z.infer<typeof NewFollowerSchema>;
