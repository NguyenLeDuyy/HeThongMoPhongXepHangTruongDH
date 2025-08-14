# Quản Lý Quán Ăn

## Giới thiệu

Dự án **Quản Lý Quán Ăn** là một hệ thống quản lý quán ăn, hỗ trợ các chức năng như đặt món, quản lý bàn ăn, quản lý nhân viên, và phân tích doanh thu. Dự án được xây dựng với công nghệ hiện đại, bao gồm **Next.js**, **Node.js**, **Fastify**, và **SQLite**.

## Tính năng chính

- **Khách hàng**:
  - Đăng nhập và đặt món ăn.
  - Xem menu và trạng thái đơn hàng.
- **Quản lý**:
  - Quản lý món ăn, bàn ăn, nhân viên.
  - Phân tích doanh thu và hiệu suất hoạt động.
- **Realtime**:
  - Cập nhật trạng thái đơn hàng và bàn ăn theo thời gian thực.

## Công nghệ sử dụng

- **Frontend**: Next.js, Tailwind CSS.
- **Backend**: Node.js, Fastify, SQLite, Prisma.
- **Realtime**: WebSocket.

## Cài đặt

### Yêu cầu hệ thống

- Node.js = 20.11.0
- npm >= 8.x

### Hướng dẫn cài đặt

1. Clone repository:

   ```bash
   git clone https://github.com/your-repo/QuanLyQuanAn.git
   cd QuanLyQuanAn
   ```

2. Cài đặt các package:

   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Khởi tạo database:

   ```bash
   cd server
   npx prisma db push
   ```

4. Chạy ứng dụng:
   - **Frontend**:
     ```bash
     cd client
     npm run dev
     ```
   - **Backend**:
     ```bash
     cd server
     npm run dev
     ```

## Deploy

### Backend

- Deploy backend lên VPS hoặc các nền tảng hỗ trợ Node.js.
- Không sử dụng SQLite và upload ảnh trên các nền tảng như Render.com (plan free).

### Frontend

- Deploy frontend lên Vercel:
- Đảm bảo backend API hoạt động trước khi deploy frontend.

## Tài khoản mặc định

- **Admin**: admin@order.com | 123456
- **User**:
  - phuminhdat@gmail.com | 123123
  - buianhson@gmail.com | 123123
  - ngocbichhuynh@gmail.com | 123123
  - binhnguyen@gmail.com | 123123

## Liên hệ

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ qua email: support@quanlyquanan.com.
