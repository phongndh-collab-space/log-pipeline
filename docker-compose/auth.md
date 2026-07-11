# Thông tin tài khoản & mật khẩu các dịch vụ

Dưới đây là thông tin đăng nhập mặc định của các công cụ và giao diện quản trị (UI) được cấu hình trong các file Docker Compose:

---

## 📊 1. Grafana
* **Địa chỉ:** [http://localhost:3000](http://localhost:3000)
* **Username:** `admin`
* **Password:** `admin123`

---

## 🛢️ 2. ClickHouse Database
* **Địa chỉ (HTTP API):** `http://localhost:8123`
* **Địa chỉ (TCP Native):** `localhost:9002` (Đã chuyển từ cổng `9000` sang `9002` trên máy host để tránh trùng)
* **Database mặc định:** `log_db`
* **Username:** `admin`
* **Password:** `admin123`

---

## 🖥️ 3. ClickHouse UI (ch-ui)
* **Địa chỉ:** [http://localhost:3488](http://localhost:3488)
* **Cấu hình kết nối vào ClickHouse từ UI:**
  * **Connection Name:** `Local ClickHouse` (Hoặc tùy chọn)
  * **ClickHouse URL:** `http://clickhouse:8123` (Nếu kết nối qua Docker network) hoặc `http://localhost:8123`
  * **Username:** `admin`
  * **Password:** `admin123`

---

## 📨 4. Redpanda Console (Kafka UI)
* **Địa chỉ:** [http://localhost:8080](http://localhost:8080)
* **Thông tin đăng nhập:** Không yêu cầu tài khoản/mật khẩu (Không có Auth ở chế độ Local).

---

## 📈 5. Prometheus
* **Địa chỉ:** [http://localhost:9090](http://localhost:9090)
* **Thông tin đăng nhập:** Không yêu cầu tài khoản/mật khẩu.

---

## 🔑 6. Kafka Broker Auth (Host connection)
* **Địa chỉ:** `localhost:9092`
* **Giao thức:** `SASL_PLAINTEXT` (Mechanism: `PLAIN`)
* **Username:** `admin`
* **Password:** `admin-secret`

