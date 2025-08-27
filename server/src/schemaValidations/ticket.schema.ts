import { TicketStatus } from '@prisma/client';
import { z } from 'zod';

export const CreateTicketBody = z.object({
  mssv: z.string().min(1, 'MSSV là bắt buộc'),
  studentName: z.string().min(1, 'Tên sinh viên là bắt buộc'),
});

export type CreateTicketBodyType = z.infer<typeof CreateTicketBody>;

export const UpdateTicketStatusBody = z.object({
  status: z.enum([TicketStatus.done, TicketStatus.skipped]),
  reason: z.string().optional(),
});

export type UpdateTicketStatusBodyType = z.infer<typeof UpdateTicketStatusBody>;

export const TicketIdParam = z.object({
  ticketId: z.string().cuid('ID vé không hợp lệ'),
});

export type TicketIdParamType = z.infer<typeof TicketIdParam>;
