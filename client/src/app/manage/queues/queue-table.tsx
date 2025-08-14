'use client';
import { useQuery } from '@tanstack/react-query';
import http from '@/lib/http';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function QueueTable() {
  const { data: queuesData } = useQuery({
    queryKey: ['queues'],
    queryFn: () => http.get('/queues'),
  });
  const queues = queuesData?.payload.data ?? [];

  const getStudentLink = useCallback((id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/queues/${id}/get-ticket`;
  }, []);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Đã sao chép link!' });
  };

  return (
    <div className="space-y-4">
      {queues.map((q: any) => {
        const studentLink = getStudentLink(q.id);
        return (
          <Card key={q.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{q.name}</p>
                <p className="text-sm text-muted-foreground">
                  Đang chờ: {q.pendingCount} | Đang phục vụ: {q.servingCount}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(studentLink)}>
                  Copy Link QR
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/manage/queues/${q.id}`} target="_blank">
                    Mở quản lý
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {queues.length === 0 && <p className="text-center text-muted-foreground">Chưa có hàng đợi nào.</p>}
    </div>
  );
}