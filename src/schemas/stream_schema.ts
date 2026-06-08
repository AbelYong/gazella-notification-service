import { z } from "zod"

export const ticketSchema = z.object({
    ticket: z.string().min(32).max(64)
});

export type TicketInput = z.infer<typeof ticketSchema>
