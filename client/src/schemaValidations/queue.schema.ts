import { z } from 'zod';

export const TicketStatus = z.enum(['pending', 'serving', 'completed', 'skipped']);

export const TicketSchema = z.object({
  id: z.string(),
  number: z.number(),
  queueId: z.string(),
  status: TicketStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
  studentName: z.string().optional(),
  mssv: z.string().optional(),
});

export type TicketType = z.infer<typeof TicketSchema>;

export const CreateTicketBody = z.object({
  // queueId: z.string(), // remove
  studentName: z.string().min(1, 'Tên sinh viên không được để trống'),
  mssv: z.string().min(1, 'MSSV không được để trống'),
});

export type CreateTicketBodyType = z.infer<typeof CreateTicketBody>;

export const UpdateTicketStatusBody = z.object({
  status: TicketStatus,
  reason: z.string().optional(),
});

export type UpdateTicketStatusBodyType = z.infer<typeof UpdateTicketStatusBody>;