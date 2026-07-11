# Hệ Thống Log Processing Service

Hệ thống Log Processing Service có khả năng tiếp nhận, xử lý và lưu trữ log tập trung từ nhiều nguồn khác nhau với quy mô hàng triệu bản ghi mỗi ngày. Dự án được thiết kế theo hướng Microservices, sử dụng **Kafka** làm hàng đợi thông điệp giảm chấn (backpressure), **Go** để tiêu thụ dữ liệu hiệu năng cao, **ClickHouse** làm kho lưu trữ phân tích dạng cột, và **Next.js** làm Dashboard giám sát real-time.

---

## 📌 Kiến Trúc Hệ Thống & Luồng Dữ Liệu

```text
  [ Locust Load Gen ]        [ Web Client App ] (Port 7001)
          │                          │
          ▼                          ▼
   [ NestJS Application Server ] (Port 7002)
          │
          ├─► (Thành công) ──► [ Kafka Cluster ] ─► Topic: `raw-logs`
          │                          │
          │                          ▼
          │                  [ Go Log Service ] (Port 7003)
          │                          │
          │                          ├─► Parse, Validate & Enrich
          │                          │
          │                          ├─► [ ClickHouse Database ] (Port 9002)
          │                          │
          │                          ├─► (Lỗi tạm thời) ──► Topic: `raw-logs-retry`
          │                          │
          │                          └─► (Lỗi nặng/Quá hạn) ──► Topic: `raw-logs-dlq`
          │
          └─► (Kafka sập) ───► [ PostgreSQL Backup DB ] (Bảng: `BackupLog`)
```

- **Client giả lập (Locust)**: Đóng vai trò là **Log Generator**, gửi hàng loạt HTTP requests giả lập nhiều client/users đồng thời với tốc độ cấu hình (TPS) để sinh log.
- **NestJS App Server**: Cung cấp API nghiệp vụ. Khi nhận request, `LoggingInterceptor` tự động ghi nhận log thô theo định dạng `<timestamp> <ip> <method> <path> <status>` và gửi bất đồng bộ vào Kafka topic `raw-logs`. Nếu Kafka sập, hệ thống tự động lưu tạm vào Postgres.
- **Go Log Service**: Tiêu thụ dữ liệu từ Kafka theo dạng **Batch** (500 logs hoặc 1 giây). Thực hiện parse, validate, enrich thông tin log rồi chèn vào ClickHouse.
- **Cơ chế xử lý lỗi (Retry/DLQ)**:
  - Nếu ghi ClickHouse lỗi tạm thời (timeout, mất kết nối ngắn), log sẽ được đưa sang topic `raw-logs-retry` để thử lại tối đa 3 lần.
  - Nếu log sai định dạng hoặc vượt quá 3 lần retry, log sẽ được đẩy vào topic `raw-logs-dlq` (Dead Letter Queue).
- **Dashboard giám sát (Log Stats - Port 7004)**: Đọc thông tin từ Go Service để hiển thị biểu đồ thống kê logs, tình trạng lag của các partition Kafka và danh sách logs trong DLQ/Retry.

---

## 📊 Danh Sách Cổng Kết Nối

| Dịch vụ | Cổng trên Host | Địa chỉ truy cập | Nhiệm vụ |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | `5435` | `localhost:5435` | Cơ sở dữ liệu quan hệ cho backup logs và app server |
| **Web Client App** | `7001` | [http://localhost:7001](http://localhost:7001) | Giao diện ví chi tiêu |
| **NestJS App Server** | `7002` | [http://localhost:7002](http://localhost:7002) | REST API nghiệp vụ tài chính |
| **Go Log Service** | `7003` | [http://localhost:7003](http://localhost:7003) | Service xử lý log chính, gán Swagger |
| **Log Stats Dashboard** | `7004` | [http://localhost:7004](http://localhost:7004) | Giao diện theo dõi trạng thái logs & Kafka |
| **Redpanda Console** | `8080` | [http://localhost:8080](http://localhost:8080) | UI quản lý, xem thông điệp trong các topic Kafka |
| **ClickHouse UI** | `3488` | [http://localhost:3488](http://localhost:3488) | Giao diện web chạy truy vấn ClickHouse |


---

## 🛠️ Yêu Cầu Tiền Đề (Prerequisites)

Trước khi khởi chạy hệ thống, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1. **Docker & Docker Compose**: Để chạy các container hạ tầng (Postgres, Kafka, ClickHouse).
2. **Node.js** (v18+) & **Yarn**: Để chạy NestJS server, Web Client, và Stats Dashboard.
3. **Go** (v1.20+): Để chạy dịch vụ xử lý log (Go Log Service).
4. **Python 3** & **pip**: Để chạy Locust giả lập sinh tải log.

---

## 🚀 Hướng Dẫn Khởi Chạy Hệ Thống

Bạn có thể chạy dự án này bằng **2 cách** khác nhau tùy vào mục đích:

---

### 🎯 CÁCH 1: Chạy thuần Docker (Thử nghiệm độc lập - Khá tốn thời gian build)
*Cách này hữu ích khi bạn muốn chạy thử nghiệm nhanh toàn bộ hệ thống khép kín mà không muốn cài đặt Node.js hay Go trên máy thật. Tuy nhiên, thời gian build các ứng dụng Node/Go trong Docker khá lâu.*

1. **Khởi chạy toàn bộ ở chế độ chạy ngầm (Detached mode)**:
   Mở terminal tại thư mục gốc của dự án và chạy:
   ```bash
   docker compose up -d --build
   ```
   *Lưu ý: Tham số `-d` (detached mode) giúp chạy ngầm các container dưới nền, giải phóng cửa sổ terminal để bạn làm việc khác.*

2. **Nạp dữ liệu mẫu (Chỉ cần chạy duy nhất lần đầu tiên)**:
   Hệ thống đã tự động chạy khởi tạo bảng dữ liệu (`npx prisma db push` cho Postgres và migration cho ClickHouse) lúc khởi động container. Bạn chỉ cần chạy lệnh sau để nạp 100 tài khoản người dùng mẫu phục vụ cho việc giả lập Locust:
   ```bash
   docker exec -it nestjs-server node dist/database/vietnamese-user-seeding.js
   ```

---

### 🛠️ CÁCH 2: Chỉ chạy Docker hạ tầng (Infra) rồi chạy Code cục bộ (Local) - 🌟 KHUYÊN DÙNG
*Phương pháp này được **khuyến khích nhất** vì giúp khởi chạy ứng dụng gần như tức thì, tiết kiệm thời gian build nặng và hỗ trợ tự động tải lại (hot-reload) khi bạn sửa code ở local.*

#### Bước 1: Khởi chạy cụm hạ tầng ở chế độ chạy ngầm (Detached mode)
Di chuyển vào thư mục [infra] và khởi chạy các database container (Postgres, Kafka, ClickHouse):
```bash
cd infra
docker compose -f docker-compose.postgres.yml -f docker-compose.kafka.yml -f docker-compose.clickhouse.yml up -d
```

#### Bước 2: Khởi chạy các ứng dụng cục bộ dưới dạng Dev Mode
Mở **4 cửa sổ Terminal riêng biệt** cho 4 ứng dụng dưới đây (mỗi ứng dụng chạy trên một terminal riêng để dễ dàng theo dõi log và sửa code trực tiếp):

1. **NestJS App Server (Terminal 1 - Cổng 7002)**:
   Di chuyển vào thư mục [server](file:///c:/Users/phong/OneDrive/Desktop/Code/log-tracing/server), cài đặt dependencies và khởi chạy ở chế độ Hot-reload:
   ```bash
   cd server
   yarn install
   npx prisma db push
   yarn seed:user
   yarn start:dev
   ```
   *Lưu ý: Tệp `server/.env` đã được cấu hình sẵn để kết nối tới Postgres qua cổng `localhost:5435` và Kafka qua cổng `localhost:9092`.*

2. **Go Log Service (Terminal 2 - Cổng 7003)**:
   Di chuyển vào thư mục [log](file:///c:/Users/phong/OneDrive/Desktop/Code/log-tracing/log), tải thư viện và chạy:
   ```bash
   cd log
   go mod tidy
   go run cmd/main.go
   ```
   *Lưu ý: Bạn cũng có thể dùng `nodemon` để tự động khởi động lại Go service khi sửa file: 
   ```bash
    nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run cmd/main.go 
    ```
3. **Web Client App (Terminal 3 - Ví Chi Tiêu - Cổng 7001)**:
   Di chuyển vào thư mục [client](file:///c:/Users/phong/OneDrive/Desktop/Code/log-tracing/client) và khởi chạy Next.js Dev Server:
   ```bash
   cd client
   yarn install
   yarn dev
   ```

4. **Stats Dashboard (Terminal 4 - Giám sát Logs - Cổng 7004)**:
   Di chuyển vào thư mục [statistics](file:///c:/Users/phong/OneDrive/Desktop/Code/log-tracing/statistics) và khởi chạy Next.js Dev Server:
   ```bash
   cd statistics
   yarn install
   yarn dev
   ```



---

### Bước 5: Giả lập sinh tải bằng Locust (Log Generator)
Mở một terminal mới và chạy các lệnh cài đặt và khởi tạo Locust để giả lập lưu lượng:
```bash
# 1. Di chuyển vào thư mục locust
cd locust

# 2. Cài đặt Locust (nếu chưa có)
pip install locust

# 3. Khởi động Locust với kịch bản test
locust -f locustfile.py
```
- Sau khi chạy thành công, mở trình duyệt truy cập: [http://localhost:8089](http://localhost:8089).
- Điền các thông số:
  - **Number of users**: `200` (Số lượng client đồng thời).
  - **Spawn rate**: `20` (Số lượng client được sinh thêm mỗi giây).
  - **Host**: `http://localhost:7002` (Địa chỉ của NestJS API).
- Bấm **Start swarming** để bắt đầu sinh log liên tục gửi vào hệ thống.

---

## 🛠 Kiểm tra các tính năng của Hệ thống

1. **Kiểm tra Log hợp lệ**: Đọc dữ liệu trong Clickhouse qua Clickhouse UI (Port `3488`) hoặc trên Dashboard (Port `7004`).
2. **Kiểm tra cơ chế Retry**:
   - Dừng clickhouse: `docker stop clickhouse`
   - Thực hiện gửi request trên client hoặc Locust.
   - Quan sát terminal của Go Service báo lỗi ghi ClickHouse và đẩy vào topic `raw-logs-retry`. Sau khi khởi động lại: `docker start clickhouse`, các log kẹt trong retry sẽ được ghi thành công.
3. **Kiểm tra DLQ (Log lỗi)**:
   - Gửi một tin nhắn sai cấu trúc JSON hoặc sai các trường bắt buộc vào topic `raw-logs` qua Redpanda UI (Port `8080`).
   - Hệ thống tự động chuyển tiếp log lỗi này sang topic `raw-logs-dlq`. Xem danh sách logs lỗi trực tiếp tại tab **Kafka Monitor** trên Dashboard (Port `7004`).
4. **Kiểm tra Fallback (Kafka sập)**:
   - Dừng Kafka: `docker stop kafka`
   - Gửi request tới NestJS. NestJS ghi nhận lỗi kết nối Kafka và lưu log trực tiếp xuống bảng `BackupLog` của Postgres. Bạn có thể xem danh sách log này trên Dashboard tại mục **Backup Logs**.

