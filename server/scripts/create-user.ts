import prisma from '@/database'
import { hashPassword } from '@/utils/crypto'

async function main() {
  const email = 'admin@order.com'
  const plain = '123456'
  const hashed = await hashPassword(plain)
  const user = await prisma.account.create({
    data: {
      name: 'Admin',
      email,
      password: hashed,
      role: 'OWNER', // hoặc 'EMPLOYEE' tùy schema
    }
  })
  console.log('created', user.id)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})