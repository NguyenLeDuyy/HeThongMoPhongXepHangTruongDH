// File: d:\Study\Web\QuanLyQuanAn\server\src\plugins\errorHandler.plugins.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { EntityError, StatusError } from '@/utils/errors'; // Giả sử bạn có các class lỗi này

// Hàm plugin phải được export default
export default async function errorHandlerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        message: 'Lỗi xác thực dữ liệu',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    if (error instanceof EntityError) {
      return reply.status(422).send({
        message: error.message,
        errors: error.errors,
      });
    }

    if (error instanceof StatusError) {
      return reply.status(error.status).send({
        message: error.message,
      });
    }

    // Log lỗi ra console để debug
    fastify.log.error(error);

    // Lỗi server mặc định
    return reply.status(500).send({
      message: 'Đã có lỗi xảy ra ở server, vui lòng thử lại sau.',
    });
  });
}