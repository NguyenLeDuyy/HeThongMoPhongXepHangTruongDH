import fastifyPlugin from 'fastify-plugin'
import { verifyAccessToken } from '@/utils/jwt'
import { AuthError } from '@/utils/errors'
import { getChalk } from '@/utils/helpers'

// TIP: keep prisma import if you need it later
// import prisma from '@/database'

export const socketPlugin = fastifyPlugin(async (fastify) => {
  const chalk = await getChalk()

  /* -------- PUBLIC namespace: KHÔNG auth -------- */
  const publicNs = fastify.io.of('/public')
  publicNs.on('connection', (socket) => {
    console.log(chalk.cyanBright('🔌 Public connected:'), socket.id)

    socket.on('join-queue', (queueId: string) => {
      socket.join(`queue-${queueId}`) // join room theo queue
    })

    socket.on('leave-queue', (queueId: string) => {
      socket.leave(`queue-${queueId}`)
    })

    socket.on('disconnect', () => {
      console.log(chalk.redBright('🔌 Public disconnected:'), socket.id)
    })
  })

  /* -------- STAFF namespace: CÓ auth qua handshake.auth -------- */
  const staffNs = fastify.io.of('/staff')

  // middleware chạy trước khi chấp nhận kết nối (dùng cho xác thực)
  staffNs.use(async (socket, next) => {
    const { Authorization } = (socket.handshake.auth || {}) as { Authorization?: string }
    if (!Authorization) return next(new AuthError('Authorization không hợp lệ'))

    try {
      const token = Authorization.split(' ')[1]
      const decoded = await verifyAccessToken(token)
        // nơi khuyến nghị để gắn dữ liệu server-side trong v4:
        // https://socket.io/docs/v4/server-socket-instance/ (socket.data)
        ; (socket.data as any).user = decoded
      return next()
    } catch (err) {
      return next(new AuthError('Token không hợp lệ'))
    }
  })

  staffNs.on('connection', (socket) => {
    console.log(chalk.cyanBright('🔌 Staff connected:'), socket.id)

    socket.on('join-queue', (queueId: string) => {
      socket.join(`queue-${queueId}`)
    })

    socket.on('leave-queue', (queueId: string) => {
      socket.leave(`queue-${queueId}`)
    })

    socket.on('disconnect', () => {
      console.log(chalk.redBright('🔌 Staff disconnected:'), socket.id)
    })
  })

  /* -------- helper emit tới CẢ 2 namespaces theo room -------- */
  fastify.decorate('emitQueue', (queueId: string, event: string, payload: any) => {
    publicNs.to(`queue-${queueId}`).emit(event, payload)
    staffNs.to(`queue-${queueId}`).emit(event, payload)
  })
})

/* ---- Type augmentation cho FastifyInstance.emitQueue ---- */
declare module 'fastify' {
  interface FastifyInstance {
    emitQueue(queueId: string, event: string, payload: any): void
  }
}
