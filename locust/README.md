# Hướng Dẫn Chạy Locust Giả Lập Tải (Load Test)

Thư mục này chứa kịch bản Load Test sử dụng công cụ **Locust** để giả lập nhiều người dùng tương tác với hệ thống API NestJS, giúp sinh nhiều dữ liệu log đẩy lên Kafka/ClickHouse/PostgreSQL.

---

## 📌 Các bước chuẩn bị và chạy

### Bước 1: Cài đặt Locust
Đảm bảo máy tính của bạn đã cài đặt Python 3. Sau đó mở terminal và chạy lệnh cài đặt thư viện `locust`:
```bash
pip install locust
```

### Bước 2: Khởi chạy Locust
Di chuyển vào thư mục `locust` này và khởi động server Locust:
```bash
# Di chuyển vào thư mục locust
cd locust

# Khởi chạy file test
locust -f locustfile.py
```
Sau khi chạy, terminal sẽ hiển thị thông báo server Locust đang chạy tại cổng `8089` (thường là `http://localhost:8089`).

### Bước 3: Cấu hình trên giao diện Web (Swarm)
Mở trình duyệt và truy cập vào địa chỉ: [http://localhost:8089](http://localhost:8089)

Điền các thông số cấu hình:
1. **Number of users**: Tổng số lượng User giả lập chạy cùng lúc (Ví dụ: `50` hoặc `100`).
2. **Spawn rate**: Số lượng User mới được tạo ra thêm mỗi giây (Ví dụ: `5` hoặc `10`).
3. **Host**: Địa chỉ API Server của NestJS. Điền:
   ```text
   http://localhost:7002
   ```
4. Bấm **Start swarming** để bắt đầu chạy load test.

---

## 🛠 Giải thích Kịch bản Test (`locustfile.py`)
Mỗi người dùng giả lập (Virtual User) sẽ hoạt động độc lập và thực hiện các bước sau:
1. **on_start (Đăng ký & Đăng nhập)**:
   * Tự động đăng ký một tài khoản ngẫu nhiên thông qua `POST /api/auth/register`.
   * Thực hiện đăng nhập `POST /api/auth/login` để lấy JWT Token và lưu vào Header của tất cả request tiếp theo.
2. **Nhiệm vụ tuần hoàn (@task)**:
   * **Xem Profile (`/api/auth/profile`)** - Tỷ lệ 30%
   * **Xem & Tạo mới danh mục (`/api/categories`)** - Tỷ lệ 20%
   * **Xem danh sách ví (`/api/wallets`)** - Tỷ lệ 20%
   * **Giả lập hành vi gây lỗi (`trigger_errors`)** - Tỷ lệ 10% (Gọi vào API không tồn tại `/api/non-existent-route...` để sinh log lỗi `404` trong ClickHouse/Postgres).
