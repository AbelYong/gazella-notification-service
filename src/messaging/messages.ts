import { NewFollowerInput } from "../schemas/social_schema.js"
import { ArticleCommentedInput, ArticleLikedInput } from "../schemas/article_schema.js"
import { NewEnrollmentInput, EnrollmentCancelledInput, ProjectAboutToBeginInput, ProjectFullInput } from "../schemas/project_schema.js";

export class NewFollowerMsg implements NewFollowerInput {
    public readonly eventKey = "NEW_FOLLOWER";
    
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
    public readonly eventKey = "ARTICLE_LIKED";

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
    public readonly eventKey = "ARTICLE_COMMENTED";

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

class EnrollmentMsg {
    constructor(
        public readonly projectId: string,
        public readonly organizerId: string,
        public readonly projectTitle: string,
        public readonly volunteerId: string,
        public readonly volunteerName: string
    ) {
        this.projectId = projectId;
        this.organizerId = organizerId;
        this.projectTitle = projectTitle;
        this.volunteerId = volunteerId;
        this.volunteerName = volunteerName;
    }
}

export class NewEnrollmentMsg extends EnrollmentMsg implements NewEnrollmentInput {
    public readonly eventKey = "NEW_ENROLLMENT";
}

export class EnrollmentCancelledMsg extends EnrollmentMsg implements EnrollmentCancelledInput {
    public readonly eventKey = "ENROLLMENT_CANCELLED";
}

export class ProjectAboutToBeginMsg implements ProjectAboutToBeginInput {
    public readonly eventKey = "PROJECT_START_NEAR";

    constructor(
        public readonly projectId: string,
        public readonly organizerId: string,
        public readonly projectTitle: string,
        public readonly startDate: Date,
        public readonly volunteerId: string,
    ) {
        this.projectId = projectId;
        this.organizerId = organizerId;
        this.projectTitle = projectTitle;
        this.startDate = startDate;
        this.volunteerId = volunteerId;
    }
}

export class ProjectFullMsg implements ProjectFullInput {
    public readonly eventKey = "PROJECT_FULL";

    constructor(
        public readonly projectId: string,
        public readonly organizerId: string,
        public readonly projectTitle: string
    ) {
        this.projectId = projectId;
        this.organizerId = organizerId;
        this.projectTitle = projectTitle;
    }
}
