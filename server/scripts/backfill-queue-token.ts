import prisma from '@/database'
import { randomId } from '@/utils/helpers'

async function main() {
    const toFix = await prisma.queue.findMany({
        where: {
            OR: [
                { token: null as any },
                { token: '' as any },
            ],
        },
        select: { id: true },
    })

    if (toFix.length === 0) {
        console.log('No queues need backfill.')
        process.exit(0)
    }

    console.log(`Backfilling token for ${toFix.length} queue(s)...`)
    for (const q of toFix) {
        await prisma.queue.update({
            where: { id: q.id },
            data: { token: randomId() },
        })
    }
    console.log('Done.')
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
