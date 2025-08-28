## Công nghệ sử dụng

- **Frontend**: Next.js, Tailwind CSS.
- **Backend**: Node.js, Fastify, SQLite, Prisma.
- **Realtime**: WebSocket.

## Cài đặt

### Yêu cầu hệ thống

- Node.js = 20.11.0
- npm >= 8.x

# Hệ thống xếp hàng - UTH (Mô phỏng)

Mục tiêu: Mô phỏng hệ thống xếp hàng tại trường đại học UTH. Ứng dụng cho phép:

- Sinh viên lấy số thứ tự cho các quầy (nhà ăn, phòng hành chính, v.v.).
- Nhân viên quản lý gọi số, chuyển trạng thái vé (đang phục vụ, hoàn thành, bỏ qua).
- Hiển thị lên màn hình TV cho khách theo dõi số đang phục vụ.
- Hỗ trợ realtime (WebSocket) để cập nhật trạng thái tức thì.

Tính năng chính

- Lấy số tự động và quản lý thứ tự.
- Giao diện dành cho khách (lấy số, xem trạng thái).
- Giao diện dành cho quản trị/nhân viên (gọi tiếp, xem lịch sử).
- Màn hình TV để hiển thị số đang phục vụ.
- Hệ thống demo phù hợp cho môi trường trường đại học (UTH).

Cấu trúc dự án (đã có sẵn trong repository)

- client/ — Frontend Next.js (UI người dùng, quản lý, guest)
  - Xem hướng dẫn nhanh: [client/README.md](client/README.md)
- server/ — Backend Node.js + Fastify (API, DB, realtime)
  - Xem hướng dẫn nhanh: [server/Readme.md](server/Readme.md)
- template/ — Mẫu giao diện/komponent (dùng để tham khảo)
  - Xem: [template/README.md](template/README.md)

Cài đặt & chạy (phát triển)

1. Backend
   - cd server
   - npm install
   - copy file .env vào folder server
   - npx prisma db push
   - npm run dev
2. Frontend
   - cd client
   - npm install
   - copy file .env vào folder client
   - npm run dev

Gợi ý cấu hình cho mô phỏng UTH

- Tạo một queue cho từng địa điểm (nhà ăn A, nhà ăn B, phòng Hành chính).
- Dùng TV mode để hiển thị queue trên thiết bị dùng chung.
- Sử dụng tài khoản demo cho nhân viên để thử gọi số.

Ghi chú triển khai

- Backend lưu ảnh vào /uploads — khi deploy ra domain thật, cập nhật biến môi trường DOMAIN/PROTOCOL để đường dẫn ảnh đúng.
- Không đưa file database local (prisma/dev.db) và uploads lên môi trường production.

Tài khoản mặc định (demo)

- Admin: admin@order.com | 123456

Liên hệ

- Người phát triển: UTH - Nhóm mô phỏng hệ thống xếp hàng
