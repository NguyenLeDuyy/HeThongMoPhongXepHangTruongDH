import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import queueApiRequest from '@/apiRequests/queue';
import { CreateQueueBodyType } from '@/schemaValidations/queue.schema';

const queryKeys = {
  all: ['queues'],
  detail: (id: string) => ['queues', id],
};

// Hook để lấy danh sách tất cả hàng đợi
export const useGetQueues = () => {
  return useQuery({
    queryKey: queryKeys.all,
    queryFn: queueApiRequest.getQueues,
  });
};

// Hook để lấy chi tiết một hàng đợi
export const useGetQueue = (id: string) => {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => queueApiRequest.getQueue(id),
    enabled: !!id, // Chỉ chạy query khi có id
  });
};

// Hook để tạo một hàng đợi mới
export const useCreateQueue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateQueueBodyType) => queueApiRequest.createQueue(body),
    onSuccess: () => {
      // Khi tạo thành công, làm mới lại danh sách hàng đợi
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
};

// (Tùy chọn) Bạn có thể thêm các hook cho update và delete tương tự