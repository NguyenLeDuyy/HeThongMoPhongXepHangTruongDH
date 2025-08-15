import prisma from '@/database'

async function main() {
  console.log('PROCESS CWD:', process.cwd())
  console.log('DATABASE_URL env:', process.env.DATABASE_URL)

  const all = await prisma.account.findMany({
    select: { id: true, email: true, name: true, role: true, password: true },
    orderBy: { id: 'asc' }
  })
  console.log('All accounts in DB:', all)

  const emailToCheck = 'admin@order.com'
  const single = await prisma.account.findUnique({ where: { email: emailToCheck } })
  console.log(`findUnique(${emailToCheck}):`, single)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})