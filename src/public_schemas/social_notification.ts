import { BaseNotification } from "./base_notification.js"

export type NewFollowerNotification = BaseNotification<{
    followedId: string;
    newFollowerId: string;
}>;
