import { z } from "zod";

export const NewFollowerSchema = z.object({
    followedId: z.uuidv4(),
    newFollowerId: z.uuidv4()
});

export type NewFollowerInput = z.infer<typeof NewFollowerSchema>;
