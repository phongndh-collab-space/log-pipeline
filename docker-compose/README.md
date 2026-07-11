# Hướng dẫn chạy Docker Compose

Thư mục này chứa các file cấu hình Docker Compose được tách theo cụm dịch vụ để dễ quản lý và vận hành.

---

## 🚀 Cách khởi chạy

### 1. Khởi chạy toàn bộ hệ thống (Khuyên dùng)
Để khởi chạy tất cả các dịch vụ (Postgres, Kafka, ClickHouse) cùng nhau:
```bash
docker compose -f docker-compose.postgres.yml -f docker-compose.kafka.yml -f docker-compose.clickhouse.yml up -d
```

### 2. Khởi chạy từng cụm riêng biệt

* **Cụm Postgres:**
  ```bash
  docker compose -f docker-compose.postgres.yml up -d
  ```

* **Cụm Kafka:**
  ```bash
  docker compose -f docker-compose.kafka.yml up -d
  ```

* **Cụm ClickHouse & UI:**
  *(Đã đổi cổng TCP trên máy host từ `9000` sang `9002` để tránh xung đột)*
  ```bash
  docker compose -f docker-compose.clickhouse.yml up -d
  ```

---

## 🛑 Cách dừng hệ thống

* **Dừng tất cả:**
  ```bash
  docker compose -f docker-compose.postgres.yml -f docker-compose.kafka.yml -f docker-compose.clickhouse.yml down
  ```

* **Dừng từng cụm riêng biệt:**
  ```bash
  docker compose -f docker-compose.postgres.yml down
  ```

  ```bash
  docker compose -f docker-compose.kafka.yml down
  ```

  ```bash
  docker compose -f docker-compose.clickhouse.yml down
  ```

---

## 📊 Danh sách cổng & Web UI

| Dịch vụ | Cổng trên Host | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | `5435` | `localhost:5435` | Cơ sở dữ liệu quan hệ cho backup logs và app server |
| **Redpanda Console** | `8080` | [http://localhost:8080](http://localhost:8080) | Giao diện quản lý Kafka |
| **ClickHouse UI** | `3488` | [http://localhost:3488](http://localhost:3488) | Giao diện quản lý ClickHouse |
| **ClickHouse HTTP** | `8123` | `http://localhost:8123` | HTTP API của ClickHouse |
| **ClickHouse TCP** | `9002` | `localhost:9002` | Cổng TCP kết nối Client (đã đổi từ `9000` sang `9002`) |
| **Kafka Broker** | `9092` | `localhost:9092` | Cổng kết nối TCP của Kafka |


