# Mô Tả Dự Án: Log Processing System

Hệ thống **Log Processing System** được xây dựng nhằm giải quyết bài toán tiếp nhận, xử lý, lưu trữ và giám sát log tập trung với quy mô hàng triệu bản ghi mỗi ngày, đảm bảo tính chịu tải cao (high throughput), khả năng khôi phục lỗi (fault tolerance), và giám sát độ tin cậy hệ thống (SRE).

Dự án được phân chia thành **2 cặp dịch vụ chính** kết hợp với **công cụ sinh tải**:

---

## 🏗️ 1. Các Cặp Dịch Vụ Cốt Lõi

### 🔹 Cặp 1: Web Application (`client` ◄─► `server`) - Môi trường Sinh Log
Đây là ứng dụng quản lý tài chính cá nhân (**Personal Budget Tracker**), đóng vai trò là ứng dụng nghiệp vụ thực tế phát sinh tương tác của người dùng.
- **Client (Next.js - Port 7001)**: Giao diện Web hiển thị ví tiền, danh mục chi tiêu, và lịch sử giao dịch. Cho phép người dùng thực hiện đăng ký/đăng nhập, chuyển khoản, và thêm giao dịch thu/chi.
- **Server (NestJS - Port 7002)**: Hệ thống REST API xử lý nghiệp vụ tài chính. Tích hợp `LoggingInterceptor` tự động bắt mọi yêu cầu/phản hồi để tạo ra dòng log thô theo định dạng `<timestamp> <ip> <method> <path> <status>` và gửi bất đồng bộ vào Kafka.

### 🔹 Cặp 2: Log Engine (`log` ◄─► `statistics`) - Hệ thống Xử lý & Giám sát Log
Đây là trung tâm thu thập, lưu trữ phân tích và giao diện giám sát vận hành của hệ thống log.
- **Log Service (Go - Port 7003)**: Dịch vụ tiêu thụ log hiệu năng cao viết bằng Go. Service consume log theo cơ chế Batch từ Kafka, thực hiện Parse (phân tích chuỗi log thô), Validate (kiểm tra tính hợp lệ), Enrich (bổ sung thông tin như nhóm mã lỗi, mốc thời gian nhận log) và thực hiện chèn số lượng lớn (Batch Insert) vào ClickHouse.
- **Statistics Dashboard (Next.js - Port 7004)**: Giao diện quản trị của kỹ sư vận hành (SRE Dashboard). Giúp theo dõi trực quan lượng log thành công/lỗi theo thời gian thực, đo lường độ trễ (Consumer Lag) của Kafka, và quản lý các log bị kẹt ở hàng đợi Retry hoặc DLQ.

### 🔹 Giả lập Tải (`locust`) - Công cụ đo lường SRE
- **Locust (Python - Port 8089)**: Công cụ giả lập hàng trăm, hàng ngàn người dùng đồng thời (Concurrency) tương tác liên tục với ứng dụng NestJS Server theo các kịch bản thực tế (đăng nhập, xem ví, tạo giao dịch, xóa ví, gọi API lỗi). Đây là công cụ đo đạc tải đỉnh điểm, giúp kiểm thử năng lực chịu tải và tính ổn định (SRE) của toàn bộ đường ống log.

---

## 🛠️ 2. Các Công Cụ Hạ Tầng & Vai Trò Kỹ Thuật

Hệ thống tích hợp 3 hạ tầng công nghệ lõi phục vụ các nhiệm vụ chuyên biệt:

### 💾 1. PostgreSQL (Cơ sở dữ liệu quan hệ - Port 5435)
Đóng hai vai trò cực kỳ quan trọng:
- **Nghiệp vụ**: Lưu trữ thông tin tài khoản người dùng, ví tiền, danh mục phân loại và các giao dịch tài chính của NestJS Server.
- **Dự phòng sự cố (Fallback Database)**: Trong trường hợp cụm Kafka bị sập hoặc mất kết nối, NestJS Server sẽ kích hoạt cơ chế Fallback ghi trực tiếp dữ liệu log thô xuống bảng `BackupLog` của Postgres để đảm bảo tuyệt đối **không bị mất mát log** của khách hàng.

### ⚡ 2. ClickHouse (Cơ sở dữ liệu dạng cột - Port 9002 TCP / 8123 HTTP)
ClickHouse là trung tâm lưu trữ log chính của dự án.
- Tối ưu hóa đặc biệt cho dữ liệu dạng chuỗi thời gian (Time-series) và ghi dữ liệu hàng loạt tốc độ cao (Batch Ingestion).
- Cho phép thực hiện các truy vấn thống kê dữ liệu log lớn (hàng triệu bản ghi) với tốc độ mili-giây, cung cấp dữ liệu tức thời cho Statistics Dashboard hiển thị đồ thị.

### 🪵 3. Kafka (Message Broker & Streaming - Port 9092)
Kafka đóng vai trò bộ đệm giảm chấn (backpressure), giúp hệ thống không bị nghẽn hay sập khi Locust sinh tải log vượt quá năng lực xử lý của Clickhouse. Dữ liệu được chia làm 3 topics chuyên biệt:
- **`raw-logs`**: Nơi tiếp nhận log thô mới nhất từ NestJS Server.
- **`raw-logs-retry`**: Khi ghi vào ClickHouse bị lỗi tạm thời (như ClickHouse quá tải/mất kết nối ngắn), log sẽ được đưa vào đây để Retry Consumer thử lại (tối đa 3 lần).
- **`raw-logs-dlq` (Dead Letter Queue)**: Nơi chứa các log bị hỏng định dạng (không thể parse) hoặc các log đã thử lại 3 lần qua topic retry mà vẫn thất bại. Giúp kỹ sư hệ thống cô lập và phân tích lỗi mà không làm ảnh hưởng đến luồng log chính.
