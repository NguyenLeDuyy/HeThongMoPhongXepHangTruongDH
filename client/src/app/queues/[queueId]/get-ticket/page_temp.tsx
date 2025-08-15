"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAppContext } from "@/components/app-provider";

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
type TicketPayload = { data: Ticket };
type ApiResp<T> = { status: number; payload: T };

export default function GetTicketPage() {
  const params = useParams();
  const queueId = params.queueId as string;
  const queryClient = useQueryClient();
  const { socket } = useAppContext();

  const [mssv, setMssv] = useState("");
  const [studentName, setStudentName] = useState("");
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);

  const { data: queueData } = useQuery<ApiResp<QueuePayload>>({
    queryKey: ["queue", queueId],
    queryFn: () => http.get<QueuePayload>(`/queues/${queueId}`),
    enabled: !!queueId,
    refetchInterval: 5000,
  });
  const createTicketMutation = useMutation<ApiResp<TicketPayload>, unknown, { mssv: string; studentName: string }>({
    mutationFn: (body) => http.post<TicketPayload>(`/queues/${queueId}/tickets`, body),
    onSuccess: (res) => {
      const ticket = res.payload.data as Ticket;
      setMyTicket(ticket);
      toast.success(`Bạn đã lấy số ${ticket.number}`);
      queryClient.invalidateQueries({ queryKey: ["queue", queueId] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err ?? 'Lỗi khi lấy vé');
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!socket || !queueId) return;
    socket.emit("join-queue", queueId);
    const refetch = () => queryClient.invalidateQueries({ queryKey: ["queue", queueId] });
    socket.on("ticket-created", refetch);
    socket.on("ticket-called", refetch);
    socket.on("ticket-updated", refetch);
    return () => {
      socket.emit("leave-queue", queueId);
      socket.off("ticket-created", refetch);
      socket.off("ticket-called", refetch);
      socket.off("ticket-updated", refetch);
    };
  }, [socket, queueId, queryClient]);

  // derive myTicket status from latest queueData if available
  useEffect(() => {
    if (!myTicket || !queueData) return;
    const q = queueData.payload.data as Queue;
    const found = q.tickets?.find((t) => t.id === myTicket.id);
    if (found) setMyTicket(found);
  }, [queueData, myTicket]);

  const handleGetTicket = async () => {
    if (!mssv.trim() || !studentName.trim()) {
      toast.error("Vui lòng nhập MSSV và tên");
      return;
    }
    createTicketMutation.mutate({ mssv: mssv.trim(), studentName: studentName.trim() });
  };

  const queue = queueData?.payload?.data as Queue | undefined;

  const position = (() => {
    if (!myTicket || !queue?.tickets) return null;
    const pendingBefore = queue.tickets.filter((t) => t.status === "pending" && t.number < myTicket.number).length;
    return pendingBefore + 1; // position among pending
  })();

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Lấy vé & Theo dõi</h2>

      {!myTicket ? (
        <Card>
          <CardHeader>
            <CardTitle>Nhập thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="MSSV" value={mssv} onChange={(e) => setMssv(e.target.value)} />
            <Input placeholder="Họ tên" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleGetTicket} disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? "Đang lấy..." : "Lấy số"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vé của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <p className="text-lg font-bold">Số: {myTicket.number}</p>
              <p>Trạng thái: <Badge variant={myTicket.status === "serving" ? "destructive" : myTicket.status === "pending" ? "outline" : "secondary"}>{myTicket.status}</Badge></p>
            </div>
            <div>
              {myTicket.status === "pending" && position != null && (
                <p>Vị trí của bạn trong hàng đang chờ: <strong>{position}</strong></p>
              )}
              {myTicket.status === "serving" && <p className="text-green-600 font-medium">Đã tới lượt bạn. Vui lòng ra cửa phục vụ.</p>}
              {myTicket.status !== "pending" && myTicket.status !== "serving" && <p>Trạng thái: {myTicket.status}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
