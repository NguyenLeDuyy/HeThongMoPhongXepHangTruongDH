import prisma from '@/database';
import { TicketStatus } from '@prisma/client';
import { CreateTicketBodyType, UpdateTicketStatusBodyType } from '@/schemaValidations/ticket.schema';
import { NotFoundError, StatusError } from '@/utils/errors';

/**
 * Sinh viên lấy một vé mới trong một hàng đợi.
 * Tự động gán số thứ tự tiếp theo.
 */
export const createTicket = async (queueId: string, data: CreateTicketBodyType) => {
  return await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.findUniqueOrThrow({ where: { id: queueId } });

    if (!queue.isOpen) {
      throw new StatusError({ status: 400, message: 'Hàng đợi này đã đóng.' });
    }

    const lastTicket = await tx.ticket.findFirst({
      where: { queueId },
      orderBy: { number: 'desc' },
    });

    const nextNumber = (lastTicket?.number ?? 0) + 1;

    // (Tùy chọn) Tìm hoặc tạo sinh viên dựa trên MSSV
    const student = await tx.student.upsert({
        where: { mssv: data.mssv },
        update: { name: data.studentName },
        create: { mssv: data.mssv, name: data.studentName }
    });

    const newTicket = await tx.ticket.create({
      data: {
        number: nextNumber,
        queueId: queueId,
        studentId: student.id,
      },
      include: {
        student: true
      }
    });

    return newTicket;
  });
};

/**
 * Nhân viên gọi vé tiếp theo trong hàng đợi.
 */
export const callNextTicket = async (queueId: string, staffId: number) => {
  return await prisma.$transaction(async (tx) => {
    const nextTicket = await tx.ticket.findFirst({
      where: {
        queueId: queueId,
        status: TicketStatus.pending,
      },
      orderBy: {
        number: 'asc',
      },
    });

    if (!nextTicket) {
      throw new NotFoundError('Không có vé nào đang chờ.');
    }

    const updatedTicket = await tx.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: TicketStatus.serving,
        calledAt: new Date(),
        serviceStartAt: new Date(),
        servedBy: staffId,
      },
      include: {
        student: true
      }
    });

    await tx.callLog.create({
      data: {
        ticketId: updatedTicket.id,
        staffId: staffId,
        action: 'call',
      },
    });

    return updatedTicket;
  });
};

/**
 * Nhân viên cập nhật trạng thái của một vé (hoàn thành, bỏ qua).
 */
export const updateTicketStatus = async (ticketId: string, staffId: number, data: UpdateTicketStatusBodyType) => {
  const { status, reason } = data;

  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  if (ticket.status === TicketStatus.completed || ticket.status === TicketStatus.skipped) {
      throw new StatusError({ status: 400, message: `Không thể cập nhật vé đã ${ticket.status}.` });
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      serviceEndAt: new Date(),
      notes: reason,
    },
  });

  await prisma.callLog.create({
    data: {
      ticketId: ticketId,
      staffId: staffId,
      action: status, // 'completed' or 'skipped'
      notes: reason,
    },
  });

  return updatedTicket;
};