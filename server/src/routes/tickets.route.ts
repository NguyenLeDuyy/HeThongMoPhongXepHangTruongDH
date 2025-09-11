import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { callNextTicket, createTicket, updateTicketStatus, cancelTicket } from '@/controllers/ticket.controller';
import { CreateTicketBody, TicketIdParam, UpdateTicketStatusBody, CancelTicketBody } from '@/schemaValidations/ticket.schema';
import { QueueIdParam } from '@/schemaValidations/queue.schema';

export default async function ticketsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Sinh viên lấy vé mới
  fastify.post('/queues/:queueId/tickets', {
    schema: {
      tags: ['Tickets'],
      summary: 'Sinh viên lấy vé mới',
      params: QueueIdParam,
      body: CreateTicketBody,
    },
    handler: async (request, reply) => {
      const { queueId } = request.params as { queueId: string };
      const ticket = await createTicket(queueId, request.body as any);

      // Gửi sự kiện real-time
      fastify.emitQueue(queueId, 'ticket-created', ticket);

      reply.status(201).send({
        message: 'Lấy vé thành công',
        data: ticket,
      });
    },
  });

  // Nhân viên gọi vé tiếp theo
  fastify.post('/queues/:queueId/call-next', {
    schema: {
      tags: ['Tickets'],
      summary: 'Nhân viên gọi vé tiếp theo',
      params: QueueIdParam,
    },
    // preHandler: [fastify.authenticate], // Bật khi cần xác thực nhân viên
    handler: async (request, reply) => {
      const { queueId } = request.params as { queueId: string };
      const staffId = (request as any).decodedAccessToken?.userId ?? 1; // Lấy ID nhân viên từ token
      const ticket = await callNextTicket(queueId, staffId);

      // Gửi sự kiện real-time
      fastify.emitQueue(queueId, 'ticket-called', ticket);

      reply.send({
        message: `Đã gọi vé số ${ticket.number}`,
        data: ticket,
      });
    },
  });

  // Nhân viên cập nhật trạng thái vé (hoàn thành/bỏ qua)
  fastify.put('/tickets/:ticketId/status', {
    schema: {
      tags: ['Tickets'],
      summary: 'Cập nhật trạng thái vé',
      params: TicketIdParam,
      body: UpdateTicketStatusBody,
    },
    // preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const staffId = (request as any).decodedAccessToken?.userId ?? 1;
      const ticket = await updateTicketStatus(ticketId, staffId, request.body as any);

      // Gửi sự kiện real-time
      // Đồng bộ với convention room `queue-<id>` và phát cho cả namespace public + staff
      fastify.emitQueue(ticket.queueId, 'ticket-updated', ticket);

      reply.send({
        message: 'Cập nhật trạng thái vé thành công',
        data: ticket,
      });
    },
  });

  // Khách tự hủy vé (cần token của queue)
  fastify.post('/tickets/:ticketId/cancel', {
    schema: {
      tags: ['Tickets'],
      summary: 'Khách hủy vé của mình (xác thực bằng token QR của queue)',
      params: TicketIdParam,
      body: CancelTicketBody,
    },
    handler: async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const ticket = await cancelTicket(ticketId, request.body as any);

      // thông báo realtime để UI cập nhật
      fastify.emitQueue(ticket.queueId, 'ticket-updated', ticket);

      reply.send({
        message: 'Đã hủy vé thành công',
        data: ticket,
      });
    },
  });
}

