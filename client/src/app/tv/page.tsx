'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import http from '@/lib/http'

type Queue = {
  id: string
  name: string
  isOpen: boolean
  pendingCount?: number
  servingCount?: number
}

type ListResp<T> = { status: number; payload: { message: string; data: T } }

export default function TvQueuesPage() {
  const { data, isLoading } = useQuery<ListResp<Queue[]>>({
    queryKey: ['tv-queues'],
    queryFn: () => http.get<{ message: string; data: Queue[] }>('/queues'),
  })

  const queuesResp = data?.payload
  const queues: Queue[] = queuesResp?.data ?? []

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chọn hàng đợi để hiển thị trên TV</h1>
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queues.map((q: Queue) => (
              <Link
                key={q.id}
                href={`/tv/${q.id}`}
                className="block rounded-lg border border-neutral-700 bg-neutral-900 p-4 hover:bg-neutral-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold truncate">{q.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded ${q.isOpen ? 'bg-green-600' : 'bg-red-600'}`}>
                    {q.isOpen ? 'Đang mở' : 'Đang đóng'}
                  </span>
                </div>
                <div className="text-sm text-neutral-300 space-y-1">
                  <p>
                    Đang phục vụ:{' '}
                    <span className="font-semibold">{q.servingCount ?? 0}</span>
                  </p>
                  <p>
                    Đang chờ:{' '}
                    <span className="font-semibold">{q.pendingCount ?? 0}</span>
                  </p>
                </div>
              </Link>
            ))}
            {queues.length === 0 && (
              <div className="col-span-full text-neutral-400">Chưa có hàng đợi nào.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
