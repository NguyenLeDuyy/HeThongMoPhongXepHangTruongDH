import prisma from '@/database';
import { CreateQueueBodyType, UpdateQueueBodyType } from '@/schemaValidations/queue.schema';
import { NotFoundError } from '@/utils/errors';
import { TicketStatus } from '@prisma/client';
import { randomId } from '@/utils/helpers';

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
        // Do schema không có model Student, chỉ lấy các trường ticket có sẵn
      },
    },
  });

  if (!queue) {
    throw new NotFoundError('Không tìm thấy hàng đợi.');
  }
  // Map lại tickets để client vẫn có `ticket.student?.name` và `ticket.student?.mssv`
  const mappedTickets = (queue.tickets ?? []).map((t) => ({
    ...t,
    student: {
      name: t.fullName ?? null,
      mssv: t.studentCode ?? null,
    },
  }));

  return { ...queue, tickets: mappedTickets };
};

/**
 * Tạo một hàng đợi mới.
 */
export const createQueue = async (data: CreateQueueBodyType) => {
  const queue = await prisma.queue.create({
    data: {
      name: data.name,
      token: randomId(),
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

/** Rotate QR token for a queue and invalidate related guest refresh tokens if needed */
export const rotateQueueToken = async (queueId: string) => {
  // Currently no guest auth per queue; we only rotate the token
  const newToken = randomId();
  const updated = await prisma.queue.update({
    where: { id: queueId },
    data: { token: newToken },
  });
  return updated;
};

/**
 * Reset số thứ tự của một hàng đợi về ban đầu.
 * Thực hiện bằng cách xóa toàn bộ tickets thuộc queue (call logs bị xoá theo cascade)
 * và đưa lastNumber về 0 để bảo toàn trạng thái.
 * Lưu ý: Do ràng buộc unique([queueId, number]), nếu không xoá các vé cũ thì không thể
 * tái sử dụng lại số bắt đầu từ 1. Vì vậy cách an toàn là xoá toàn bộ vé.
 */
export const resetQueue = async (queueId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Đảm bảo queue tồn tại
    await tx.queue.findUniqueOrThrow({ where: { id: queueId } });

    // Xoá tất cả vé của queue này (CallLog xoá theo cascade)
    await tx.ticket.deleteMany({ where: { queueId } });

    // Đặt lại lastNumber về 0 (dù hiện tại logic sinh số dựa trên vé, vẫn nên đồng bộ)
    const updatedQueue = await tx.queue.update({ where: { id: queueId }, data: { lastNumber: 0 } });

    return updatedQueue;
  });
};