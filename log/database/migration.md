# Hướng dẫn chạy Migration cho ClickHouse (Tự động/Thủ công)

Dự án này sử dụng một trình chạy migration thủ công được tích hợp trực tiếp bằng mã nguồn Go, giúp tự động đọc và thực thi các file SQL khi ứng dụng khởi chạy. 

Giải pháp này **không yêu cầu cài đặt bất kỳ công cụ bên ngoài nào** (như Atlas hay golang-migrate), giúp dự án gọn gàng và dễ phân phối cho các máy phát triển khác.

---

## 📂 Cấu trúc thư mục Migrations

Các file SQL migration được đặt trong thư mục:
`database/clickhouse/migrations/`

Ví dụ cấu trúc:
```text
database/
└── clickhouse/
    └── migrations/
        └── 20260710080000_create_logs.sql
```

Tên file bắt buộc tuân thủ quy tắc đặt tên: `[Version]_[Tên_mô_tả].sql` (trong đó `Version` là một chuỗi số duy nhất, thường lấy theo thời gian, ví dụ: `20260710080000`).

---

## 🚀 Cách hoạt động

Khi Go Log Service khởi động:
1. Nó tự động tạo bảng `schema_migrations` trên ClickHouse (nếu chưa có) để lưu trữ danh sách các file SQL đã được thực thi.
2. Nó quét thư mục `database/clickhouse/migrations/` để tìm toàn bộ các file `.sql`.
3. Sắp xếp thứ tự các file theo phiên bản (`Version`).
4. Nếu phát hiện file SQL nào chưa được chạy, nó sẽ thực thi câu lệnh SQL trong file đó và ghi nhận lịch sử vào bảng `schema_migrations`.
5. Nếu file đã được chạy, nó sẽ bỏ qua.

---

## 🔄 Quy trình làm việc khi thay đổi Schema (Workflow)

Mỗi khi bạn cần thêm hoặc chỉnh sửa bảng trong cơ sở dữ liệu ClickHouse:

1. **Tạo file SQL mới:** Tạo một file `.sql` mới trong thư mục `database/clickhouse/migrations/` với định dạng tên `[timestamp]_[tên_file].sql`.
   * *Ví dụ:* Tạo file `database/clickhouse/migrations/20260710120000_add_user_agent.sql` chứa nội dung:
     ```sql
     ALTER TABLE logs ADD COLUMN user_agent String;
     ```
2. **Khởi chạy ứng dụng:** Chạy lại Go Log Service bằng lệnh:
   ```bash
   go run cmd/main.go
   ```
   Hoặc:
   ```bash
   nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run cmd/main.go
   ```
3. **Kiểm tra log:** Ứng dụng sẽ in thông báo áp dụng thành công:
   ```text
   Applying ClickHouse migration: 20260710120000_add_user_agent.sql...
   Migration 20260710120000_add_user_agent.sql applied successfully!
   ```
4. **Commit Git:** Lưu file `.sql` mới tạo lên repository Git để đồng bộ cho toàn bộ dự án.
