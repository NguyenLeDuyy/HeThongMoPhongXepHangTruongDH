import { z } from 'zod';

export const QueueIdParam = z.object({
  queueId: z.string().min(1, 'ID hàng đợi là bắt buộc'),
});

export const CreateQueueBody = z.object({
  name: z.string().min(1, 'Tên hàng đợi là bắt buộc'),
  isOpen: z.boolean().optional(),
});

export const UpdateQueueBody = z.object({
  name: z.string().min(1).optional(),
  isOpen: z.boolean().optional(),
});

// Server-side queue schema (add token for QR)
export const QueueSchemaServer = z.object({
  id: z.string(),
  name: z.string(),
  isOpen: z.boolean(),
  lastNumber: z.number(),
  token: z.string(),
  createdAt: z.date(),
});

export const QueueResServer = z.object({
  data: QueueSchemaServer,
  message: z.string().optional(),
});

export type QueueResServerType = z.infer<typeof QueueResServer>;

// Các dòng export type này là tùy chọn nhưng nên có để code rõ ràng hơn
export type QueueIdParamType = z.infer<typeof QueueIdParam>;
export type CreateQueueBodyType = z.infer<typeof CreateQueueBody>;
export type UpdateQueueBodyType = z.infer<typeof UpdateQueueBody>;