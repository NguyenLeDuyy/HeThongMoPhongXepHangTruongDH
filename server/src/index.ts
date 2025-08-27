// File: d:\Study\Web\QuanLyQuanAn\server\src\index.ts
import auth from '@fastify/auth';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';

// --- Import đầy đủ các thành phần ---
import validatorCompilerPlugin from './plugins/validatorCompiler.plugins';
import errorHandlerPlugin from './plugins/errorHandler.plugins'; // Đã có file
import { socketPlugin } from '@/plugins/socket.plugins';
import authRoutes from '@/routes/auth.route';
import accountRoutes from '@/routes/account.route'; // Đã có file
import queueRoutes from '@/routes/queues.route';
import ticketRoutes from '@/routes/tickets.route';
import mediaRoutes from '@/routes/media.route';
import staticRoutes from '@/routes/static.route';
import dishRoutes from '@/routes/dish.route';
import tablesRoutes from '@/routes/table.route';
import guestRoutes from '@/routes/guest.route';
import orderRoutes from '@/routes/order.route';
import indicatorRoutes from '@/routes/indicator.route';
import testRoutes from '@/routes/test.route';
import { initOwnerAccount } from '@/controllers/account.controller';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  fastify.log.info({ DATABASE_URL: process.env.DATABASE_URL }, 'env debug');

  // 1. Đăng ký các plugin cơ bản
  await fastify.register(cors, {
    origin: [CLIENT_URL, '*'], // Thêm '*' để cho phép các domain khác
    credentials: true,
  });

  await fastify.register(socketio, {
    cors: {
      origin: [CLIENT_URL],
      credentials: true,
    },
  });

  // 2. Đăng ký các plugin xử lý của chúng ta
  await fastify.register(auth);
  await fastify.register(validatorCompilerPlugin);
  await fastify.register(errorHandlerPlugin); // Sẽ không còn lỗi ở đây
  await fastify.register(socketPlugin);

  // 3. Đăng ký các routes với prefix
  fastify.log.info('Đăng ký các routes...');
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(accountRoutes, { prefix: '/accounts' }); // Sẽ không còn lỗi ở đây
  await fastify.register(mediaRoutes, { prefix: '/media' });
  await fastify.register(staticRoutes, { prefix: '/static' });
  await fastify.register(dishRoutes, { prefix: '/dishes' });
  await fastify.register(tablesRoutes, { prefix: '/tables' });
  await fastify.register(orderRoutes, { prefix: '/orders' });
  await fastify.register(guestRoutes, { prefix: '/guest' });
  await fastify.register(indicatorRoutes, { prefix: '/indicators' });
  await fastify.register(testRoutes, { prefix: '/test' });
  await fastify.register(queueRoutes, { prefix: '/queues' });
  await fastify.register(ticketRoutes);

  // Khởi tạo tài khoản owner nếu chưa có
  await initOwnerAccount();

  // 4. Fallback cho các route không tồn tại
  fastify.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ message: `Route ${req.method}:${req.url} không tồn tại.` });
  });

  // In ra tất cả các routes đã đăng ký để kiểm tra
  await fastify.ready();
  fastify.log.info('Các routes đã được đăng ký:\n' + fastify.printRoutes());

  // 5. Khởi động server
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Server backend đang chạy tại: http://${HOST}:${PORT}`);
  fastify.log.info(`Cho phép client từ: ${CLIENT_URL}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});