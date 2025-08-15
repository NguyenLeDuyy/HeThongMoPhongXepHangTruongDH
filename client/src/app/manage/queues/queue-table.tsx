'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { QueueListResType, QueueResType, QueueType } from '@/schemaValidations/queue.schema';

export default function QueueTable() {
  const queryClient = useQueryClient();
  const { data: queuesData, isLoading } = useQuery({
    queryKey: ['queues'],
    queryFn: () => http.get<QueueListResType>('/queues'),
  });
  const queues = (queuesData?.payload.data as QueueListResType['data']) ?? [];

  // Local state for creating a queue
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => http.post<QueueResType>('/queues', { name }),
    onSuccess: () => {
      toast.success('Đã tạo hàng đợi');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: (error) => {
      toast.error('Tạo thất bại');
      console.error(error);
    }
  });

  const updateName = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => http.put<QueueResType>(`/queues/${id}`, { name: newName }),
    onSuccess: () => {
      toast.success('Đã cập nhật tên');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: () => toast.error('Cập nhật thất bại')
  });

  const toggleOpen = useMutation({
    mutationFn: ({ id, isOpen }: { id: string; isOpen: boolean }) => http.put<QueueResType>(`/queues/${id}`, { isOpen }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: () => toast.error('Cập nhật thất bại')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => http.delete(`/queues/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa hàng đợi');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: () => toast.error('Xóa thất bại')
  });

  const getStudentLink = useCallback((id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/queues/${id}/get-ticket`;
  }, []);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Đã sao chép link!');
  };

  return (
    <div className="space-y-4">
      {isLoading && (
        <p className="text-sm text-muted-foreground">Đang tải danh sách hàng đợi...</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Tạo hàng đợi</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Tên hàng đợi" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo'}
          </Button>
        </CardContent>
      </Card>

  {queues.map((q: QueueType) => {
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
                <Button size="sm" variant="secondary" onClick={() => {
                  const newName = prompt('Nhập tên mới', q.name)
                  if (newName && newName !== q.name) updateName.mutate({ id: q.id, newName })
                }}>
                  Đổi tên
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleOpen.mutate({ id: q.id, isOpen: !q.isOpen })}>
                  {q.isOpen ? 'Đóng' : 'Mở'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(studentLink)}>
                  Copy Link QR
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/manage/queues/${q.id}`} target="_blank">
                    Mở quản lý
                  </Link>
                </Button>
                <Button size="sm" variant="destructive" onClick={() =>
                  confirm('Xóa hàng đợi này?') && deleteMutation.mutate(q.id)
                }>
                  Xóa
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