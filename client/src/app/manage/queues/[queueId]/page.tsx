'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { handleErrorApi } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/components/app-provider';

// --- Local API/types for this page ---
type Ticket = {
  id: string;
  number: number | string;
  status: string;
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

  useEffect(() => {
    if (!socket || !queueId) return;
    socket.emit('join-queue', queueId);
    const refetchQueue = () => queryClient.invalidateQueries({ queryKey: ['queue', queueId] });

    socket.on('ticket-created', refetchQueue);
    socket.on('ticket-called', refetchQueue);
    socket.on('ticket-updated', refetchQueue);

    return () => {
      socket.emit('leave-queue', queueId);
      socket.off('ticket-created', refetchQueue);
      socket.off('ticket-called', refetchQueue);
      socket.off('ticket-updated', refetchQueue);
    };
  }, [socket, queueId, queryClient]);

  const handleCallNext = async () => {
    try {
      await callNextMutation.mutateAsync();
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  const queue = queueData?.payload.data;
  const tickets = queue?.tickets ?? [];

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{queue?.name ?? 'Quản lý hàng đợi'}</CardTitle>
          <Button onClick={handleCallNext} disabled={callNextMutation.isPending}>
            {callNextMutation.isPending ? 'Đang gọi...' : 'Gọi số tiếp theo'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.map((ticket: Ticket) => (
            <Card key={ticket.id} className={`p-4 flex justify-between items-center ${ticket.status === 'serving' ? 'bg-yellow-100' : ''}`}>
              <div>
                <p className="text-lg font-bold">Số: {ticket.number}</p>
                <p>SV: {ticket.student?.name} - MSSV: {ticket.student?.mssv}</p>
              </div>
              <Badge variant={ticket.status === 'serving' ? 'destructive' : 'outline'}>{ticket.status}</Badge>
            </Card>
          ))}
          {tickets.length === 0 && <p className="text-center text-muted-foreground">Chưa có vé nào trong hàng.</p>}
        </CardContent>
      </Card>
    </div>
  );
}