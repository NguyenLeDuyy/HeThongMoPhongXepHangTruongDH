import prisma from '@/database';
import { CreateQueueBodyType, UpdateQueueBodyType } from '@/schemaValidations/queue.schema';
import { NotFoundError } from '@/utils/errors';
import { TicketStatus } from '@prisma/client';

/**
 * Lấy danh sách tất cả các hàng đợi cùng với số vé đang chờ và đang phục vụ.
 */
export const getQueues = async () => {
  const queues = await prisma.queue.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const queuesWithCounts = await Promise.all(
    queues.map(async (queue) => {
      const pendingCount = await prisma.ticket.count({
        where: { queueId: queue.id, status: TicketStatus.pending },
      });
      const servingCount = await prisma.ticket.count({
        where: { queueId: queue.id, status: TicketStatus.serving },
      });
      return { ...queue, pendingCount, servingCount };
    })
  );

  return queuesWithCounts;
};

/**
 * Lấy thông tin chi tiết của một hàng đợi, bao gồm cả danh sách các vé.
 */
export const getQueueDetails = async (queueId: string) => {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      tickets: {
        orderBy: {
          number: 'asc',
        },
        include: {
          student: true, // Giả sử bạn có model Student liên kết
        }
      },
    },
  });

  if (!queue) {
    throw new NotFoundError('Không tìm thấy hàng đợi.');
  }
  return queue;
};

/**
 * Tạo một hàng đợi mới.
 */
export const createQueue = async (data: CreateQueueBodyType) => {
  const queue = await prisma.queue.create({
    data: {
      name: data.name,
    },
  });
  return queue;
};

/**
 * Cập nhật thông tin hàng đợi (ví dụ: đổi tên, đóng/mở).
 */
export const updateQueue = async (queueId: string, data: UpdateQueueBodyType) => {
  return await prisma.queue.update({
    where: { id: queueId },
    data,
  });
};

/**
 * Xóa một hàng đợi (sẽ xóa tất cả các vé và log liên quan).
 */
export const deleteQueue = async (queueId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.callLog.deleteMany({ where: { ticket: { queueId } } });
    await tx.ticket.deleteMany({ where: { queueId } });
    await tx.queue.delete({ where: { id: queueId } });
  });
};