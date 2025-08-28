'use client'
import { useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import http from '@/lib/http'
import { io, Socket } from 'socket.io-client'
import envConfig from '@/config'
import Image from 'next/image'

type Ticket = {
  id: string
  number: number
  status: 'pending' | 'serving' | 'skipped' | 'done' | string
  calledAt?: string | null
}

type Queue = {
  id: string
  name: string
  tickets: Ticket[]
}

type DetailResp = { status: number; payload: { message: string; data: Queue } }

export default function TvDisplayPage() {
  const params = useParams()
  const queueId = params.queueId as string

  const { data, isLoading, refetch } = useQuery<DetailResp>({
    queryKey: ['tv-queue', queueId],
    queryFn: () => http.get<{ message: string; data: Queue }>(`/queues/${queueId}`),
    enabled: !!queueId,
    refetchOnWindowFocus: false,
  })

  // connect to public namespace (no auth) for TV
  useEffect(() => {
    if (!queueId) return
    const socket: Socket = io(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/public`)
    socket.emit('join-queue', queueId)
    const onUpdate = () => refetch()
    socket.on('ticket-created', onUpdate)
    socket.on('ticket-called', onUpdate)
    socket.on('ticket-updated', onUpdate)
    return () => {
      socket.emit('leave-queue', queueId)
      socket.off('ticket-created', onUpdate)
      socket.off('ticket-called', onUpdate)
      socket.off('ticket-updated', onUpdate)
      socket.disconnect()
    }
  }, [queueId, refetch])

  const queue = data?.payload.data
  const { current, nextList } = useMemo(() => {
    const tickets = queue?.tickets ?? []
    const serving = tickets.find((t) => t.status === 'serving')
    const waiting = tickets.filter((t) => t.status === 'pending').sort((a, b) => a.number - b.number)
    return {
      current: serving ?? null,
      nextList: waiting.slice(0, 5),
    }
  }, [queue])

  if (isLoading) return <div className="min-h-screen bg-white text-black flex items-center justify-center">Đang tải...</div>

  return (
    <div className="min-h-screen bg-white text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo" width={250} height={250} className="object-contain" />
            <div className="flex-1 text-center mr-60">
              <h1 className="text-4xl font-bold">{queue?.name ?? 'Hàng đợi'}</h1>
              <p className="text-neutral-600">Màn hình TV</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch text-white">
          <div className="lg:col-span-2 bg-[rgb(0,134,137)] rounded-xl p-8 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold mb-3">Đang phục vụ</p>
            <div className="text-[120px] leading-none font-black tracking-widest ">
              {current?.number ?? '-'}
            </div>
          </div>

          <div className="bg-[rgb(0,134,137)] rounded-xl p-6">
            <p className="text-xl font-semibold mb-4">Số tiếp theo</p>
            <div className="space-y-3">
              {nextList.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3">
                  <span className="text-2xl font-bold">{t.number}</span>
                  <span className="text-xs text-neutral-400">chờ</span>
                </div>
              ))}
              {nextList.length === 0 && (
                <div className="text-white">Chưa có vé chờ.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
