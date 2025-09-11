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
  token: z.string().min(1, 'Token là bắt buộc'),
});

export type CreateTicketBodyType = z.infer<typeof CreateTicketBody>;

export const UpdateTicketStatusBody = z.object({
  status: TicketStatus,
  reason: z.string().optional(),
});

export type UpdateTicketStatusBodyType = z.infer<typeof UpdateTicketStatusBody>;

// ===================== QUEUE (client) =====================
export const QueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  isOpen: z.boolean().optional(),
  lastNumber: z.number().optional(),
  token: z.string().optional(),
  createdAt: z.string().optional(),
  pendingCount: z.number().default(0),
  servingCount: z.number().default(0),
  avgServiceSec: z.number().optional(),
  estimatedWaitSec: z.number().optional()
})

export type QueueType = z.infer<typeof QueueSchema>

export const QueueListRes = z.object({
  message: z.string(),
  data: z.array(QueueSchema)
})

export type QueueListResType = z.TypeOf<typeof QueueListRes>

export const CreateQueueBody = z.object({
  name: z.string().min(1)
})

export type CreateQueueBodyType = z.TypeOf<typeof CreateQueueBody>

export const QueueRes = z.object({
  message: z.string(),
  data: QueueSchema
})

export type QueueResType = z.TypeOf<typeof QueueRes>

export const UpdateQueueBody = z.object({
  name: z.string().min(1).optional(),
  isOpen: z.boolean().optional()
})

export type UpdateQueueBodyType = z.TypeOf<typeof UpdateQueueBody>