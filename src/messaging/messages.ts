import { NewFollowerInput } from "../schemas/social_schema.js"
import { ArticleCommentedInput, ArticleLikedInput } from "../schemas/article_schema.js"

export class NewFollowerMsg implements NewFollowerInput {
    constructor(
        public readonly followedId: string,
        public readonly newFollowerId: string,
        public readonly newFollowerName: string,
        public readonly newFollowerPfpUri: string | undefined,
    ) {
        this.followedId = followedId;
        this.newFollowerId = newFollowerId;
        this.newFollowerName = newFollowerName;
        this.newFollowerPfpUri = newFollowerPfpUri;
    }
}

export class ArticleLikedMsg implements ArticleLikedInput {
    constructor(
        public readonly articleId: string,
        public readonly authorId: string,
        public readonly likeId: string,
        public readonly likeAuthorId: string
    ) {
        this.articleId = articleId;
        this.authorId = authorId;
        this.likeId = likeId;
        this.likeAuthorId = likeAuthorId;
    }
}

export class ArticleCommentedMsg implements ArticleCommentedInput {
    constructor(
        public readonly articleId: string,
        public readonly authorId: string,
        public readonly commentId: string,
        public readonly commentAuthorId: string,
        public readonly content: string
    ) {
        this.articleId = articleId;
        this.authorId = authorId;
        this.commentId = commentId;
        this.commentAuthorId = commentAuthorId;
        this.content = content; 
    }
}
