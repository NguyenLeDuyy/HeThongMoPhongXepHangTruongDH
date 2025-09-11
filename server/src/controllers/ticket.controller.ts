import prisma from '@/database';
import { TicketStatus } from '@prisma/client';
import { CancelTicketBodyType, CreateTicketBodyType, UpdateTicketStatusBodyType } from '@/schemaValidations/ticket.schema';
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

    // Enforce QR token
    if (!data.token || data.token !== queue.token) {
      throw new StatusError({ status: 401, message: 'Mã QR không hợp lệ hoặc đã hết hạn.' });
    }

    const lastTicket = await tx.ticket.findFirst({
      where: { queueId },
      orderBy: { number: 'desc' },
    });

    const nextNumber = (lastTicket?.number ?? 0) + 1;

    // Schema hiện không có model Student. Thay vì upsert vào model không tồn tại,
    // lưu thông tin sinh viên trực tiếp vào các trường trên Ticket (studentCode, fullName).
    const newTicket = await tx.ticket.create({
      data: {
        number: nextNumber,
        queueId: queueId,
        studentCode: data.mssv,
        fullName: data.studentName,
      },
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
        // Only set servedBy if the staff account exists to avoid FK constraint errors
        servedBy: (await tx.account.findUnique({ where: { id: staffId } })) ? staffId : null,
      },
      // no include of `student` because schema has no Student model; use ticket fields
    });

    await tx.callLog.create({
      data: {
        ticketId: updatedTicket.id,
        staffId: (await tx.account.findUnique({ where: { id: staffId } })) ? staffId : null,
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

  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUniqueOrThrow({ where: { id: ticketId } });

    if (ticket.status === TicketStatus.done || ticket.status === TicketStatus.skipped) {
      throw new StatusError({ status: 400, message: `Không thể cập nhật vé đã ${ticket.status}.` });
    }

    const updatedTicket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        finishedAt: new Date(),
        cancelReason: reason ?? null,
      },
    });

    // Guard staffId to avoid FK violation if account not found
    const staff = await tx.account.findUnique({ where: { id: staffId } });
    await tx.callLog.create({
      data: {
        ticketId,
        staffId: staff ? staffId : null,
        action: String(status), // 'done' or 'skipped'
        note: reason ?? null,
      },
    });

    return updatedTicket;
  });
};

/**
 * Khách hủy vé của mình (yêu cầu token QR hợp lệ của queue chứa vé)
 */
export const cancelTicket = async (ticketId: string, data: CancelTicketBodyType) => {
  const { token } = data;
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Không tìm thấy vé.');

    const queue = await tx.queue.findUnique({ where: { id: ticket.queueId } });
    if (!queue) throw new NotFoundError('Không tìm thấy hàng đợi.');

    // verify token
    if (!token || token !== queue.token) {
      throw new StatusError({ status: 401, message: 'Mã QR không hợp lệ hoặc đã hết hạn.' });
    }

    // Only allow cancel when pending or serving
    if (ticket.status === TicketStatus.done || ticket.status === TicketStatus.skipped) {
      throw new StatusError({ status: 400, message: 'Vé đã hoàn tất hoặc đã hủy.' });
    }

    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.skipped, cancelReason: 'Guest canceled', finishedAt: new Date() },
    });

    await tx.callLog.create({
      data: { ticketId, staffId: null, action: 'skip', note: 'Guest canceled' },
    });

    return updated;
  });
};