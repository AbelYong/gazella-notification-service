import { z } from "zod";

export const NewEnrollmentSchema = z.object({
    eventKey: z.enum(["NEW_ENROLLMENT"]).default("NEW_ENROLLMENT"),
    projectId: z.uuidv4(),
    organizerId: z.uuidv4(),
    projectTitle: z.string(),
    volunteerId: z.uuidv4(),
    volunteerName: z.string()
});

export type NewEnrollmentInput = z.infer<typeof NewEnrollmentSchema>

export const EnrollmentCancelledSchema = z.object({
    eventKey: z.enum(["ENROLLMENT_CANCELLED"]).default("ENROLLMENT_CANCELLED"),
    projectId: z.uuidv4(),
    organizerId: z.uuidv4(),
    projectTitle: z.string(),
    volunteerId: z.uuidv4(),
    volunteerName: z.string()
});

export type EnrollmentCancelledInput = z.infer<typeof EnrollmentCancelledSchema>

export const ProjectAboutToBeginSchema = z.object({
    eventKey: z.enum(["PROJECT_START_NEAR"]).default("PROJECT_START_NEAR"),
    projectId: z.uuidv4(),
    organizerId: z.uuidv4(),
    projectTitle: z.string(),
    startDate: z.coerce.date(),
    volunteerId: z.uuidv4()
});

export type ProjectAboutToBeginInput = z.infer<typeof ProjectAboutToBeginSchema>

export const ProjectFullSchema = z.object({
    eventKey: z.enum(["PROJECT_FULL"]).default("PROJECT_FULL"),
    projectId: z.uuidv4(),
    organizerId: z.uuidv4(),
    projectTitle: z.string(),
});

export type ProjectFullInput = z.infer<typeof ProjectFullSchema>
