'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QueueTable from './queue-table'

export default function ManageQueuesPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý hàng đợi</CardTitle>
        </CardHeader>
        <CardContent>
          <QueueTable />
        </CardContent>
      </Card>
    </div>
  )
}
