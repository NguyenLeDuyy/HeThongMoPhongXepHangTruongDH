'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTicketBody, CreateTicketBodyType } from '@/schemaValidations/queue.schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { useParams } from 'next/navigation';
import { handleErrorApi } from '@/lib/utils';
import { toast } from 'sonner';
import { TicketResType } from '@/schemaValidations/ticket.schema';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/components/app-provider';
import { Badge } from '@/components/ui/badge';

type Ticket = {
  id: string;
  number: number;
  status: string;
  queueId: string;
};

type Queue = {
  id: string;
  name?: string;
  tickets?: Ticket[];
};

type QueuePayload = { data: Queue };
type ApiResp<T> = { status: number; payload: T };

export default function GetTicketPage() {
  const params = useParams();
  const queueId = params.queueId as string;
  const queryClient = useQueryClient();
  const { socket } = useAppContext();
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);

  const form = useForm<CreateTicketBodyType>({
    resolver: zodResolver(CreateTicketBody),
    defaultValues: {
      studentName: '',
      mssv: '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (body: CreateTicketBodyType) => http.post<TicketResType>(`/queues/${queueId}/tickets`, body),
    onSuccess: (res) => {
      const ticket = res.payload.data;
      setMyTicket(ticket);
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
    },
  });
  async function onSubmit(values: CreateTicketBodyType) {
    try {
      const result = await createTicketMutation.mutateAsync(values);
      toast.success('Thành công', {
        description: `Bạn đã lấy số thành công! Số của bạn là ${result.payload.data.number}`,
      });
      form.reset();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  }
  
  // fetch queue periodically and via socket events
  const { data: queueData } = useQuery<ApiResp<QueuePayload>>({
    queryKey: ['queue', queueId],
    queryFn: () => http.get<QueuePayload>(`/queues/${queueId}`),
    enabled: !!queueId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!socket || !queueId) return;
    socket.emit('join-queue', queueId);
    const refetch = () => queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
    socket.on('ticket-created', refetch);
    socket.on('ticket-called', refetch);
    socket.on('ticket-updated', refetch);
    return () => {
      socket.emit('leave-queue', queueId);
      socket.off('ticket-created', refetch);
      socket.off('ticket-called', refetch);
      socket.off('ticket-updated', refetch);
    };
  }, [socket, queueId, queryClient]);

  useEffect(() => {
    if (!myTicket || !queueData) return;
    const q = queueData.payload.data as Queue;
    const found = q.tickets?.find((t) => t.id === myTicket.id);
    if (found) setMyTicket(found);
  }, [queueData, myTicket]);

  const queue = queueData?.payload?.data as Queue | undefined;
  const position = (() => {
    if (!myTicket || !queue?.tickets) return null;
    const pendingBefore = queue.tickets.filter((t) => t.status === 'pending' && t.number < myTicket.number).length;
    return pendingBefore + 1;
  })();
  

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Lấy số thứ tự</CardTitle>
        </CardHeader>
        <CardContent>
          {!myTicket ? (
            <Form {...form}>
              <form className="space-y-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="studentName">Họ và Tên</Label>
                      <Input id="studentName" required {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mssv"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="mssv">Mã số sinh viên</Label>
                      <Input id="mssv" required {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? 'Đang xử lý...' : 'Lấy số'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-bold">Số của bạn: {myTicket.number}</p>
              <p>
                Trạng thái: <Badge variant={myTicket.status === 'serving' ? 'destructive' : myTicket.status === 'pending' ? 'outline' : 'secondary'}>{myTicket.status}</Badge>
              </p>
              {myTicket.status === 'pending' && position != null && <p>Vị trí trong hàng đang chờ: <strong>{position}</strong></p>}
              {myTicket.status === 'serving' && <p className="text-green-600 font-medium">Đã tới lượt bạn. Vui lòng ra cửa phục vụ.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}