'use client';

import { MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/data-table';
import { useGetQueues } from '@/queries/useQueue'; // Sẽ tạo hook này
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho một hàng trong bảng
type QueueItem = {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: string;
  pendingCount: number;
  servingCount: number;
};

// Định nghĩa các cột cho bảng
export const queueTableColumns: ColumnDef<QueueItem>[] = [
  {
    accessorKey: 'name',
    header: 'Tên hàng đợi',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const isOpen = row.original.isOpen;
      return <Badge variant={isOpen ? 'default' : 'destructive'}>{isOpen ? 'Đang mở' : 'Đã đóng'}</Badge>;
    },
  },
  {
    accessorKey: 'pendingCount',
    header: 'Đang chờ',
  },
  {
    accessorKey: 'servingCount',
    header: 'Đang phục vụ',
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm'),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const queue = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/manage/queues/${queue.id}`)}>
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem>Xóa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function QueueTable() {
  const { data: queuesData, isLoading } = useGetQueues(); // Sử dụng React Query để fetch dữ liệu
  const queues = queuesData?.payload.data ?? [];

  return (
    <div>
      {/* Thêm nút tạo hàng đợi ở đây nếu cần */}
      <DataTable columns={queueTableColumns} data={queues} isLoading={isLoading} />
    </div>
  );
}