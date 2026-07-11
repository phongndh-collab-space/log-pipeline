import random
import json
import os
from locust import HttpUser, task, between

# Đọc danh sách usernames trực tiếp từ tệp user.json gốc để đảm bảo khớp 100%
user_json_path = os.path.join(os.path.dirname(__file__), "../user.json")
try:
    with open(user_json_path, "r", encoding="utf-8") as f:
        users_data = json.load(f)
    usernames = [u["username"] for u in users_data]
except Exception as e:
    # Fallback nếu gặp lỗi
    usernames = ["anh", "binh", "cuong", "dung", "hung", "huy", "khanh", "kien", "lam", "long"]

class SystemUser(HttpUser):
    host = "http://localhost:7002"
    # Thời gian nghỉ ngẫu nhiên giữa các request (từ 0.1 đến 0.5 giây để tăng tần suất gọi)
    wait_time = between(0.1, 0.5)

    def on_start(self):
        """
        Chạy trước khi user thực hiện các task.
        Mỗi User giả lập sẽ ngẫu nhiên chọn 1 trong 100 tài khoản đã seed dạng không dấu để đăng nhập.
        """
        self.username = random.choice(usernames)
        self.password = "123456"
        self.token = None
        self.headers = {}

        # Đăng nhập để lấy token
        login_payload = {
            "username": self.username,
            "password": self.password
        }
        
        self.wallets = [] # Dùng để lưu trữ ví lấy từ API, phục vụ tạo giao dịch

        with self.client.post("/api/auth/login", json=login_payload, catch_response=True) as response:
            if response.status_code in [200, 201]:
                resp_json = response.json()
                auth_data = resp_json.get("data") if isinstance(resp_json.get("data"), dict) else resp_json
                self.token = auth_data.get("accessToken") or auth_data.get("token") or resp_json.get("accessToken")
                if self.token:
                    self.headers = {"Authorization": f"Bearer {self.token}"}
                    response.success()
                else:
                    response.failure(f"Login response did not contain a token: {response.text}")
            else:
                response.failure(f"Login failed for user {self.username}: {response.text}")

    @task(3)
    def view_profile(self):
        """
        Task xem thông tin Profile cá nhân (Tỷ trọng cao)
        """
        if self.token:
            self.client.get("/api/auth/profile", headers=self.headers)

    @task(2)
    def manage_categories(self):
        """
        Task xem danh sách categories và ngẫu nhiên tạo một category mới
        """
        if not self.token:
            return
            
        # Xem danh sách categories
        self.client.get("/api/categories", headers=self.headers)
        
        # 30% cơ hội tạo mới category để sinh đa dạng log
        if random.random() < 0.3:
            category_payload = {
                "name": f"Locust Category {random.randint(1, 1000)}",
                "type": random.choice(["INCOME", "EXPENSE"]),
                "icon": "Tag",
                "color": "#3B82F6"
            }
            self.client.post("/api/categories", json=category_payload, headers=self.headers)

    @task(2)
    def manage_wallets(self):
        """
        Task xem danh sách ví và tạo ví mới (Tỷ trọng trung bình)
        """
        if not self.token:
            return

        # 1. Gọi GET lấy danh sách ví
        with self.client.get("/api/wallets", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                self.wallets = response.json()
                response.success()
            else:
                response.failure(f"Failed to fetch wallets list: {response.text}")

        # 2. 30% cơ hội tạo ví mới
        if random.random() < 0.3:
            wallet_payload = {
                "name": f"Ví Locust {random.randint(1, 100)}",
                "balance": random.randint(100000, 10000000),
                "currency": "VND"
            }
            with self.client.post("/api/wallets", json=wallet_payload, headers=self.headers, catch_response=True) as response:
                if response.status_code in [200, 201]:
                    # Cập nhật lại danh sách ví sau khi tạo mới thành công
                    new_wallet = response.json()
                    self.wallets.append(new_wallet)
                    response.success()
                else:
                    response.failure(f"Failed to create wallet: {response.text}")

    @task(2)
    def manage_transactions(self):
        """
        Task xem danh sách giao dịch và tạo giao dịch mới (Tỷ trọng trung bình)
        """
        if not self.token:
            return

        # 1. Xem lịch sử giao dịch
        self.client.get("/api/transactions", headers=self.headers)

        # 2. 30% cơ hội tạo giao dịch nếu đã có ví
        if len(self.wallets) > 0 and random.random() < 0.3:
            random_wallet = random.choice(self.wallets)
            wallet_id = random_wallet.get("id")
            
            transaction_payload = {
                "amount": random.randint(10000, 500000),
                "type": random.choice(["INCOME", "EXPENSE"]),
                "description": f"Giao dịch Locust {random.randint(1, 1000)}",
                "walletId": wallet_id
            }

            self.client.post("/api/transactions", json=transaction_payload, headers=self.headers)

    @task(1)
    def trigger_errors(self):
        """
        Task giả lập hành động lỗi để sinh Error Logs (mã lỗi 4xx) giúp ClickHouse & Postgres có dữ liệu lỗi.
        """
        # 1. Gọi vào API cần Token nhưng KHÔNG truyền Token (Lỗi 401 Unauthorized)
        with self.client.get("/api/categories", catch_response=True) as response:
            if response.status_code == 401:
                response.success()
            else:
                response.failure(f"Expected 401 Unauthorized, but got: {response.status_code}")
        
        # 2. Xóa Category với ID không tồn tại (Lỗi 400 hoặc 404)
        if self.token:
            with self.client.delete("/api/categories/99999", headers=self.headers, catch_response=True) as response:
                if response.status_code in [400, 404]:
                    response.success()
                else:
                    response.failure(f"Expected 400/404, but got: {response.status_code}")
        
        # 3. Gửi dữ liệu tạo ví sai định dạng (Lỗi 400 Bad Request)
        if self.token:
            with self.client.post("/api/wallets", json={"name": ""}, headers=self.headers, catch_response=True) as response:
                if response.status_code == 400:
                    response.success()
                else:
                    response.failure(f"Expected 400 Bad Request, but got: {response.status_code}")
