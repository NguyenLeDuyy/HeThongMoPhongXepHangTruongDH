// server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';

import { socketPlugin } from '@/plugins/socket.plugins';
import queueRoutes from '@/routes/queues.route';
import ticketRoutes from '@/routes/tickets.route';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

async function bootstrap() {
  const fastify = Fastify({
    logger: true, // bật log cho dễ debug
  });

  // 1) CORS cho REST (Socket.IO CORS đã cấu hình trong plugin socket)
  await fastify.register(cors, {
    origin: [CLIENT_URL],   // thêm domain thật khi deploy
    credentials: true,
  });

  // 2) Đăng ký Socket.IO namespaces (/public, /staff) TRƯỚC routes
  await fastify.register(socketPlugin);

  // 3) REST routes
  await fastify.register(queueRoutes);
  await fastify.register(ticketRoutes);

  // 4) (tuỳ chọn) 404 fallback
  fastify.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ message: 'Not Found' });
  });

  // 5) Start server
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`HTTP  : http://${HOST}:${PORT}`);
  fastify.log.info(`Client: ${CLIENT_URL}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
