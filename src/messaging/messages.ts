import { NewFollowerInput } from "../schemas/social_schema.js"

export class NewFollowerMsg implements NewFollowerInput {
    constructor(
        public readonly followedId: string,
        public readonly newFollowerId: string,
        public readonly message: string,
        public readonly pfpUri: string | undefined,
    ) {
        this.followedId = followedId;
        this.newFollowerId = newFollowerId;
        this.message = message;
        this.pfpUri = pfpUri;
    }
}
