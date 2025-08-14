import http from '@/lib/http';
import {
  CreateQueueBodyType,
  QueueListResType,
  QueueResType,
  UpdateQueueBodyType,
} from '@/schemaValidations/queue.schema';

const queueApiRequest = {
  // Lấy danh sách tất cả hàng đợi
  getQueues: () => http.get<QueueListResType>('/queues'),

  // Tạo một hàng đợi mới
  createQueue: (body: CreateQueueBodyType) => http.post<QueueResType>('/queues', body),

  // Lấy thông tin chi tiết một hàng đợi
  getQueue: (id: string) => http.get<QueueResType>(`/queues/${id}`),

  // Cập nhật hàng đợi
  updateQueue: (id: string, body: UpdateQueueBodyType) => http.put<QueueResType>(`/queues/${id}`, body),

  // Xóa hàng đợi
  deleteQueue: (id: string) => http.delete<QueueResType>(`/queues/${id}`),
};

export default queueApiRequest;