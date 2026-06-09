import { z } from "zod"

export const ArticleLikedSchema = z.object({
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    likeId: z.uuidv4(),
    likeAuthorId: z.uuidv4()
});

export type ArticleLikedInput = z.infer<typeof ArticleLikedSchema>

export const ArticleCommentedSchema = z.object({
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    commentId: z.uuidv4(),
    commentAuthorId: z.uuidv4(),
    content: z.string()
});

export type ArticleCommentedInput = z.infer<typeof ArticleCommentedSchema>
