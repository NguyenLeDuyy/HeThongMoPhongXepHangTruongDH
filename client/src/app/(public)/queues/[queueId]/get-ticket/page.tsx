'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTicketBody, CreateTicketBodyType } from '@/schemaValidations/queue.schema';
import { useMutation } from '@tanstack/react-query';
import http from '@/lib/http';
import { useParams } from 'next/navigation';
import { handleErrorApi } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function GetTicketPage() {
  const params = useParams();
  const queueId = params.queueId as string;

  const form = useForm<CreateTicketBodyType>({
    resolver: zodResolver(CreateTicketBody),
    defaultValues: {
      studentName: '',
      mssv: '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (body: CreateTicketBodyType) => http.post(`/queues/${queueId}/tickets`, body),
  });

  async function onSubmit(values: CreateTicketBodyType) {
    if (createTicketMutation.isPending) return;
    try {
      const result = await createTicketMutation.mutateAsync(values);
      toast({
        title: 'Thành công',
        description: `Bạn đã lấy số thành công! Số của bạn là ${result.payload.data.number}`,
      });
      form.reset();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Lấy số thứ tự</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}