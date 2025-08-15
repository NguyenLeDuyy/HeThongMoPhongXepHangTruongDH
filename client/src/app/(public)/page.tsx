"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppContext } from "@/components/app-provider";

export default function Home() {
  const router = useRouter();
  const { isAuth } = useAppContext();
  const [queueId, setQueueId] = useState("");

  const goToGetTicket = () => {
    if (!queueId.trim()) {
      toast.error("Vui lòng nhập mã hàng đợi");
      return;
    }
    router.push(`/queues/${queueId.trim()}/get-ticket`);
  };

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Hệ thống xếp hàng</h1>
          <p className="text-muted-foreground">Hỗ trợ lấy số thứ tự và quản lý hàng đợi nhanh chóng.</p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lấy số thứ tự</CardTitle>
              <CardDescription>Nhập mã hàng đợi do quản trị cung cấp để lấy số.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="Nhập mã hàng đợi (VD: q123)"
                value={queueId}
                onChange={(e) => setQueueId(e.target.value)}
              />
              <Button onClick={goToGetTicket} disabled={!queueId.trim()}>Đi</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quản trị</CardTitle>
              <CardDescription>Đăng nhập để truy cập trang quản lý.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
              {!isAuth ? (
                <Button asChild className="w-full sm:col-span-2">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/manage/dashboard">Bảng điều khiển</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/manage/queues">Quản lý hàng đợi</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn khác</CardTitle>
            <CardDescription>Trải nghiệm dành cho khách.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            <Button asChild variant="outline" className="w-full">
              <Link href="/guest/menu">Xem thực đơn</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/guest/orders">Đơn của tôi</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
