import z from 'zod'
import { TicketSchema } from '@/schemaValidations/queue.schema'

// Response when creating/calling/updating a ticket
export const TicketRes = z.object({
	message: z.string(),
	data: TicketSchema
})

export type TicketResType = z.TypeOf<typeof TicketRes>

