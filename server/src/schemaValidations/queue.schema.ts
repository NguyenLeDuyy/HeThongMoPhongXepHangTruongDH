import { z } from 'zod';

export const CreateQueueBody = z.object({
  name: z.string().min(1, 'Tên hàng đợi là bắt buộc'),
});

export type CreateQueueBodyType = z.infer<typeof CreateQueueBody>;

export const UpdateQueueBody = z.object({
  name: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export type UpdateQueueBodyType = z.infer<typeof UpdateQueueBody>;

export const QueueIdParam = z.object({
  queueId: z.string().uuid('ID hàng đợi không hợp lệ'),
});

export type QueueIdParamType = z.infer<typeof QueueIdParam>;
