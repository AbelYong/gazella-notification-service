import { BaseNotification } from "./base_notification.js"
import { ArticleCommentedInput, ArticleLikedInput } from "../schemas/article_schema.js"

export type ArticleLikedNotification = BaseNotification<ArticleLikedInput>

export type ArticleCommentedNotification = BaseNotification<ArticleCommentedInput>
