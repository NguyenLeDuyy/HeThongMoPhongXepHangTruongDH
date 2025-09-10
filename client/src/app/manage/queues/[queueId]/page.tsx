'use client';
import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { handleErrorApi } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/components/app-provider';
import { Separator } from '@/components/ui/separator';

// --- Local API/types for this page ---
type Ticket = {
  id: string;
  number: number | string;
  status: string;
  createdAt?: string;
  calledAt?: string | null;
  finishedAt?: string | null;
  student?: { name?: string; mssv?: string } | null;
};

type Queue = {
  id: string;
  name?: string;
  tickets?: Ticket[];
};

type QueuePayload = { data: Queue };

type ApiResp<T> = { status: number; payload: T };

export default function StaffQueuePage() {
  const { socket } = useAppContext();
  const params = useParams();
  const queryClient = useQueryClient();
  const queueId = params.queueId as string;

  const { data: queueData, isLoading } = useQuery<ApiResp<QueuePayload>>({
    queryKey: ['queue', queueId],
    queryFn: () => http.get<QueuePayload>(`/queues/${queueId}`),
    enabled: !!queueId,
  });

  const callNextMutation = useMutation({
    mutationFn: () => http.post(`/queues/${queueId}/call-next`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { ticketId: string; status: 'done' | 'skipped'; reason?: string }) =>
      http.put(`/tickets/${payload.ticketId}/status`, {
        status: payload.status,
        reason: payload.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
    },
  });

  useEffect(() => {
    if (!socket || !queueId) return;
    socket.emit('join-queue', queueId);
    const refetchQueue = () => queryClient.invalidateQueries({ queryKey: ['queue', queueId] });

    socket.on('ticket-created', refetchQueue);
    socket.on('ticket-called', refetchQueue);
    socket.on('ticket-updated', refetchQueue);
    socket.on('queue-reset', refetchQueue);

    return () => {
      socket.emit('leave-queue', queueId);
      socket.off('ticket-created', refetchQueue);
      socket.off('ticket-called', refetchQueue);
      socket.off('ticket-updated', refetchQueue);
      socket.off('queue-reset', refetchQueue);
    };
  }, [socket, queueId, queryClient]);

  const handleCallNext = async () => {
    try {
      await callNextMutation.mutateAsync();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleMarkDone = async (ticketId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId, status: 'done' });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const handleSkip = async (ticketId: string) => {
    try {
      // Simple prompt for reason; could be replaced by a Dialog later
      const reason = window.prompt('Lý do bỏ qua (tuỳ chọn):') ?? undefined;
      await updateStatusMutation.mutateAsync({ ticketId, status: 'skipped', reason });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const queue = queueData?.payload.data;
  const { serving, pending, doneList, skippedList } = useMemo(() => {
    const tickets: Ticket[] = (queue?.tickets ?? []) as Ticket[];
    const serving = tickets.find((t) => t.status === 'serving') || null;
    const pending = tickets
      .filter((t) => t.status === 'pending')
      .slice()
      .sort((a, b) => Number(a.number) - Number(b.number));
    const doneList = tickets
      .filter((t) => t.status === 'done')
      .slice()
      .sort((a, b) => new Date(b.finishedAt || 0).getTime() - new Date(a.finishedAt || 0).getTime())
      .slice(0, 10);
    const skippedList = tickets
      .filter((t) => t.status === 'skipped')
      .slice()
      .sort((a, b) => new Date(b.finishedAt || 0).getTime() - new Date(a.finishedAt || 0).getTime())
      .slice(0, 10);
    return { serving, pending, doneList, skippedList };
  }, [queue]);

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{queue?.name ?? 'Quản lý hàng đợi'}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleCallNext} disabled={callNextMutation.isPending}>
            {callNextMutation.isPending ? 'Đang gọi...' : 'Gọi số tiếp theo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Đang phục vụ */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Đang phục vụ</CardTitle>
            {serving && (
              <div className="flex gap-2">
                <Button variant="default" onClick={() => handleMarkDone(serving.id)} disabled={updateStatusMutation.isPending}>
                  Hoàn thành
                </Button>
                <Button variant="destructive" onClick={() => handleSkip(serving.id)} disabled={updateStatusMutation.isPending}>
                  Bỏ qua
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {serving ? (
              <div className="flex items-center justify-between p-6 rounded-lg bg-muted">
                <div>
                  <div className="text-5xl font-extrabold">{serving.number}</div>
                  <div className="text-muted-foreground">
                    SV: {serving.student?.name ?? '-'} — MSSV: {serving.student?.mssv ?? '-'}
                  </div>
                </div>
                <Badge variant="destructive">serving</Badge>
              </div>
            ) : (
              <div className="text-muted-foreground">Chưa có vé nào đang phục vụ.</div>
            )}
            <Separator className="my-4" />
            <div>
              <div className="text-sm mb-2 text-muted-foreground">Số tiếp theo</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {pending.slice(0, 6).map((t) => (
                  <div key={t.id} className="text-center rounded-md bg-background border p-3 font-semibold">
                    {t.number}
                  </div>
                ))}
                {pending.length === 0 && <div className="text-muted-foreground">Không có vé chờ.</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách chờ */}
        <Card>
          <CardHeader>
            <CardTitle>Đang chờ ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[560px] overflow-auto pr-2">
            {pending.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-semibold">Số: {t.number}</div>
                  <div className="text-xs text-muted-foreground">SV: {t.student?.name ?? '-'} — MSSV: {t.student?.mssv ?? '-'}</div>
                </div>
                <Badge variant="outline">pending</Badge>
              </div>
            ))}
            {pending.length === 0 && <div className="text-muted-foreground">Không có vé chờ.</div>}
          </CardContent>
        </Card>
      </div>

      {/* Lịch sử gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Đã hoàn thành (gần đây)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneList.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="font-medium">Số: {t.number}</div>
                <Badge variant="outline">done</Badge>
              </div>
            ))}
            {doneList.length === 0 && <div className="text-muted-foreground">Chưa có bản ghi.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Đã bỏ qua (gần đây)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skippedList.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="font-medium">Số: {t.number}</div>
                <Badge variant="outline">skipped</Badge>
              </div>
            ))}
            {skippedList.length === 0 && <div className="text-muted-foreground">Chưa có bản ghi.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}