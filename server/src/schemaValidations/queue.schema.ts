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

// Các dòng export type này là tùy chọn nhưng nên có để code rõ ràng hơn
export type QueueIdParamType = z.infer<typeof QueueIdParam>;
export type CreateQueueBodyType = z.infer<typeof CreateQueueBody>;
export type UpdateQueueBodyType = z.infer<typeof UpdateQueueBody>;