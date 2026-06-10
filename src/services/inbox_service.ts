import { SocialRepository } from "../data_access/social_repository.js"
import { ArticleRepository } from "../data_access/article_repository.js"
import { ProjectRepository } from "../data_access/project_repository.js"
import { NotFoundError } from "./service_error.js";

export class InboxService {
    private readonly socialRepo: SocialRepository;
    private readonly articleRepo: ArticleRepository;
    private readonly projectRepo: ProjectRepository;
    
    constructor(socialRepo: SocialRepository, articleRepo: ArticleRepository, projectRepo: ProjectRepository) {
        this.socialRepo = socialRepo;
        this.articleRepo = articleRepo;
        this.projectRepo = projectRepo;
    }

    async getAllUnreadNotifications(userId: string) {
        const socialNotifications = await this.socialRepo.getUnreadNotifications(userId);
        const articleNotifications = await this.articleRepo.getUnreadNotifications(userId);
        const projectNotifications = await this.projectRepo.getUnreadNotifications(userId);

        return socialNotifications.concat(articleNotifications, projectNotifications);
    }
    
    /**
     * Updates a social notification status to read
     * @param notificationId 
     * @throws {NotFoundError} if no notification was found for the provided Id
     */
    async markSocialNotificationAsRead(notificationId: string) {
        const notification = await this.socialRepo.markNotificationAsRead(notificationId);

        if (!notification) {
            throw new NotFoundError(`A social notification with Id: ${notificationId} could not be found. It might have been marked as read already`);
        }
    }

    /**
     * Updates an article notification status to read
     * @param notificationId
     * @throws {NotFoundError} if no notification was found for the provided Id
     */
    async markArticleNotificationAsRead(notificationId: string) {
        const notification = await this.articleRepo.markNotificationAsRead(notificationId);

        if (!notification) {
            throw new NotFoundError(`An article notification with Id: ${notificationId} could not be found. It might have been marked as read already`);
        }
    }

    /**
     * Updates a project notification status to read
     * @param notificationId
     * @throws {NotFoundError} if no notification was found for the provided Id
     */
    async markProjectNotificationAsRead(notificationId: string) {
        const notification = await this.projectRepo.markNotificationAsRead(notificationId);

        if (!notification) {
            throw new NotFoundError(`A project notification with Id: ${notificationId} could not be found. It might have been marked as read already`);
        }
    }
}
