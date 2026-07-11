import random
import unicodedata
from locust import HttpUser, task, between

def remove_diacritics(text):
    text = unicodedata.normalize('NFKD', text)
    text = ''.join([c for c in text if not unicodedata.combining(c)])
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return text

male_names = [
    "Anh", "Bình", "Cường", "Dũng", "Hùng", "Huy", "Khánh", "Kiên", "Lâm", "Long",
    "Minh", "Nam", "Nghĩa", "Ngọc", "Phát", "Phong", "Phúc", "Quang", "Quốc", "Sơn",
    "Tài", "Tâm", "Tân", "Thắng", "Thành", "Thái", "Thiện", "Thọ", "Tiến", "Toàn",
    "Trí", "Trung", "Trường", "Tuấn", "Văn", "Việt", "Vinh", "Vũ", "Xuân", "Hải",
    "Hoàng", "Hiếu", "Hòa", "Khoa", "Lợi", "Mạnh", "Phú", "Tùng", "Duy", "Đạt"
]

female_names = [
    "An", "Anh", "Ánh", "Bích", "Chi", "Diễm", "Diệu", "Dung", "Giang", "Hà",
    "Hạnh", "Hiền", "Hoa", "Hồng", "Hương", "Khánh", "Kiều", "Lan", "Lệ", "Liên",
    "Linh", "Loan", "Mai", "Mỹ", "Ngân", "Ngọc", "Nhàn", "Nhi", "Như", "Oanh",
    "Phương", "Quỳnh", "Sương", "Thảo", "Thanh", "Thi", "Thu", "Thúy", "Trang", "Trinh",
    "Tuyết", "Uyên", "Vân", "Vy", "Yến", "Ái", "Tiên", "Tường", "Hòa", "Đào"
]

all_names = male_names + female_names

# Tạo ra danh sách account đăng nhập giống hệt logic bên NestJS seed
usernames = []
used_accounts = set()

for name in all_names:
    clean_name = remove_diacritics(name)
    account = clean_name.lower().strip()
    
    if account in used_accounts:
        counter = 2
        while f"{account}{counter}" in used_accounts:
            counter += 1
        account = f"{account}{counter}"
        
    used_accounts.add(account)
    usernames.append(account)

class SystemUser(HttpUser):
    host = "http://localhost:7002"
    # Thời gian nghỉ ngẫu nhiên giữa các request (từ 1 đến 5 giây)
    wait_time = between(1, 5)

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
                data = response.json()
                self.token = data.get("accessToken") or data.get("token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                response.success()
            else:
                response.failure(f"Đăng nhập thất bại cho user {self.username}: {response.text}")

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
                response.failure(f"Không thể lấy danh sách ví: {response.text}")

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
                    response.failure(f"Tạo ví thất bại: {response.text}")

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
        self.client.get("/api/categories")
        
        # 2. Xóa Category với ID không tồn tại (Lỗi 400 hoặc 404)
        if self.token:
            self.client.delete("/api/categories/99999", headers=self.headers)
        
        # 3. Gửi dữ liệu tạo ví sai định dạng (Lỗi 400 Bad Request)
        if self.token:
            self.client.post("/api/wallets", json={"name": ""}, headers=self.headers)
