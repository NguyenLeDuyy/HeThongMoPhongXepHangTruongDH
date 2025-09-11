import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  createQueue,
  deleteQueue,
  getQueueDetails,
  getQueues,
  updateQueue,
} from '@/controllers/queue.controller';
import { resetQueue, rotateQueueToken } from '@/controllers/queue.controller';
import { CreateQueueBody, QueueIdParam, QueueIdParamType, UpdateQueueBody } from '@/schemaValidations/queue.schema';

export default async function queuesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Lấy danh sách tất cả hàng đợi
  fastify.get('/', {
    schema: {
      tags: ['Queues'],
      summary: 'Lấy danh sách hàng đợi',
    } as any,
    handler: async (request: any, reply: any) => {
      const queues = await getQueues();
      reply.send({
        message: 'Lấy danh sách hàng đợi thành công',
        data: queues,
      });
    },
  });

  // Lấy chi tiết một hàng đợi
  fastify.get('/:queueId', {
    schema: {
      tags: ['Queues'],
      summary: 'Lấy thông tin chi tiết một hàng đợi',
      params: QueueIdParam,
    } as any,
    handler: async (request: any, reply: any) => {
      // Sử dụng type đã import để code an toàn hơn, không cần 'as any'
      const { queueId } = request.params as QueueIdParamType;
      // SỬA LẠI: Gọi hàm getQueueDetails đã import từ controller
      const queue = await getQueueDetails(queueId);
      reply.send({
        message: 'Lấy thông tin hàng đợi thành công',
        data: queue,
      });
    },
  });

  // Tạo hàng đợi mới
  fastify.post('/', {
    schema: {
      tags: ['Queues'],
      summary: 'Tạo hàng đợi mới',
      body: CreateQueueBody,
    } as any,
    handler: async (request: any, reply: any) => {
      const queue = await createQueue(request.body as any);
      reply.status(201).send({
        message: 'Tạo hàng đợi thành công',
        data: queue,
      });
    },
  });

  // Cập nhật hàng đợi
  fastify.put('/:queueId', {
    schema: {
      tags: ['Queues'],
      summary: 'Cập nhật thông tin hàng đợi',
      params: QueueIdParam,
      body: UpdateQueueBody,
    } as any,
    handler: async (request: any, reply: any) => {
      const { queueId } = request.params as { queueId: string };
      const queue = await updateQueue(queueId, request.body as any);
      reply.send({
        message: 'Cập nhật hàng đợi thành công',
        data: queue,
      });
    },
  });

  // Xóa hàng đợi
  fastify.delete('/:queueId', {
    schema: {
      tags: ['Queues'],
      summary: 'Xóa một hàng đợi',
      params: QueueIdParam,
    } as any,
    handler: async (request: any, reply: any) => {
      const { queueId } = request.params as { queueId: string };
      await deleteQueue(queueId);
      reply.send({
        message: 'Xóa hàng đợi thành công',
      });
    },
  });

  // Reset số thứ tự về ban đầu cho một hàng đợi
  fastify.post('/:queueId/reset-number', {
    schema: {
      tags: ['Queues'],
      summary: 'Reset số thứ tự về ban đầu',
      params: QueueIdParam,
    } as any,
    handler: async (request: any, reply: any) => {
      const { queueId } = request.params as QueueIdParamType;
      // Controller sẽ xóa tất cả ticket của queue và đặt lastNumber về 0
      const queue = await resetQueue(queueId);

      // emit sự kiện để UI đang mở realtime cập nhật lại danh sách vé
      fastify.emitQueue(queueId, 'queue-reset', { queueId });

      reply.send({
        message: 'Đã reset số thứ tự về ban đầu',
        data: queue,
      });
    },
  });

  // Đổi mã QR (rotate token) cho một hàng đợi
  fastify.post('/:queueId/rotate-token', {
    schema: {
      tags: ['Queues'],
      summary: 'Đổi mã QR của hàng đợi (rotate token)',
      params: QueueIdParam,
    } as any,
    handler: async (request: any, reply: any) => {
      const { queueId } = request.params as QueueIdParamType;
      const queue = await rotateQueueToken(queueId);
      // Thông báo realtime nếu cần để UI cập nhật QR/link
      fastify.emitQueue(queueId, 'queue-token-rotated', { queueId });
      reply.send({
        message: 'Đổi mã QR thành công',
        data: queue,
      });
    },
  });

}

