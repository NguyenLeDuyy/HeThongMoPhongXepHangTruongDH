import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QueueTable from "@/app/manage/queues/queue-table"; // Component này sẽ được tạo ở bước 3
export default async function Home() {
  
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Hàng đợi</CardTitle>
            <CardDescription>
              Quản lý hàng đợi sinh viên. Nhân viên có thể xem, tạo mới, và điều phối các hàng đợi tại đây.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueueTable />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
