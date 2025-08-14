import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  createQueue,
  deleteQueue,
  getQueueDetails,
  getQueues,
  updateQueue,
} from '@/controllers/queue.controller';
import { CreateQueueBody, QueueIdParam, QueueIdParamType, UpdateQueueBody } from '@/schemaValidations/queue.schema';

export default async function queuesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Lấy danh sách tất cả hàng đợi
  fastify.get('/', {
    schema: {
      tags: ['Queues'],
      summary: 'Lấy danh sách hàng đợi',
    },
    handler: async (request, reply) => {
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
    },
    handler: async (request, reply) => {
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
    },
    handler: async (request, reply) => {
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
    },
    handler: async (request, reply) => {
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
    },
    handler: async (request, reply) => {
      const { queueId } = request.params as { queueId: string };
      await deleteQueue(queueId);
      reply.send({
        message: 'Xóa hàng đợi thành công',
      });
    },
  });
}

