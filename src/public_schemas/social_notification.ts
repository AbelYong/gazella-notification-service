import { NewFollowerInput } from "../schemas/social_schema.js";
import { BaseNotification } from "./base_notification.js"

export type NewFollowerNotification = BaseNotification<NewFollowerInput>;
