import { BaseNotification } from "./base_notification.js"
import { NewEnrollmentInput, EnrollmentCancelledInput, ProjectAboutToBeginInput, ProjectFullInput } from "../schemas/project_schema.js"

export type NewEnrollmentNotification = BaseNotification<NewEnrollmentInput>

export type EnrollmentCancelledNotification = BaseNotification<EnrollmentCancelledInput>

export type ProjectAboutToBeginNotification = BaseNotification<ProjectAboutToBeginInput>

export type ProjectFullNotification = BaseNotification<ProjectFullInput>
