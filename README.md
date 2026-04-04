# DACK_OnlineLearningWEB

## Cập nhật hôm nay (01/04/2026)

- **Chat hỗ trợ (admin)**: Socket.io trên server, model tin nhắn, API/route messages, handler chat; trang `admin-chat` + script tương ứng, liên kết từ dashboard admin; phục vụ upload/static cho chat (multer, thư mục upload).
- **Hồ sơ người dùng**: upload ảnh đại diện (`POST /api/auth/profile/avatar`), cập nhật `avatarUrl` qua profile; giao diện profile xem/preview avatar.
- **Backend**: file `backend/bin/www.js` được **theo dõi trong Git** (ngoại lệ trong `.gitignore` so với rule chung `bin/*` dành cho build Visual Studio).

---

## Cập nhật gần đây (enrollment + quiz)

Xem chi tiết trong **[CAP-NHAT-ENROLLMENT-QUIZ.md](./CAP-NHAT-ENROLLMENT-QUIZ.md)** (middleware enrollment, route quiz, `course-watch.js`, hướng dẫn kiểm tra).

---

## Cập nhật mới nhất (thanh toán chuyển khoản + admin)

### 1) Luồng thanh toán chuyển khoản có xác nhận admin
- Thêm trang người dùng `OnlineLearningWeb/payment.html`:
  - Hiển thị thông tin chuyển khoản:
    - Ngân hàng: **TECHCOMBANK**
    - Tên tài khoản: **Nguyễn Lê Thành Đạt**
    - STK: **19038491122011**
  - Hiển thị QR VietQR đầy đủ thông tin (bank + account + amount + transfer code).
  - Nút **"Tôi đã chuyển khoản"** gửi yêu cầu tạo đơn thanh toán (trạng thái chờ xác nhận).
- Thêm backend quản lý đơn:
  - Model: `backend/models/paymentOrders.js`
  - Route: `backend/routes/paymentOrders.js`
  - Mount API trong `backend/app.js`: `app.use("/api/payment-orders", ...)`
- API chính:
  - `POST /api/payment-orders` (user tạo đơn từ giỏ)
  - `GET /api/payment-orders` (admin xem danh sách đơn, có thể lọc trạng thái)
  - `POST /api/payment-orders/:id/confirm` (admin xác nhận thanh toán)
- Khi admin xác nhận:
  - Cập nhật `enrollments` cho user
  - Tăng `inventory.soldCount`
  - Làm trống giỏ hàng của user
  - Đơn chuyển sang trạng thái `PAID`

### 2) Trang admin xác nhận thanh toán
- Thêm trang `OnlineLearningWeb/admin-payment-orders.html`
- Thêm script `OnlineLearningWeb/js/admin-payment-orders.js`
- Thêm menu vào dashboard admin để vào trang quản lý thanh toán.
- Trang hiển thị:
  - Mã đơn, người dùng, tổng tiền, trạng thái, thời gian
  - Nút **Xác nhận** cho đơn đang `PENDING`

### 3) Cập nhật giỏ hàng và trang khóa học
- `OnlineLearningWeb/cart.html` + `js/cart-page.js`:
  - Bỏ thanh toán demo cũ
  - Bỏ nút `-1`
  - Mỗi khóa học chỉ thêm một lần
  - Thêm ảnh nhỏ (thumbnail) cạnh tên khóa học
  - Nút thanh toán chuyển hướng sang `payment.html`
- `OnlineLearningWeb/course.html` + `js/course-list.js`:
  - Sidebar **Course Category** load động từ API category
  - Hỗ trợ lọc khóa học theo category bằng checkbox

### 4) Phân quyền giao diện theo vai trò
- `OnlineLearningWeb/js/login-page.js`:
  - Login thành công:
    - `ADMIN` -> chuyển thẳng `admin-dashboard.html`
    - `USER` -> chuyển `course.html`
- `OnlineLearningWeb/js/auth-nav.js`:
  - Dropdown tài khoản hiển thị phù hợp theo role (ADMIN/USER)
- Đồng bộ header các trang admin (`admin-dashboard`, `admin-courses`, `admin-categories`, `admin-users`, `admin-lesson-quizzes`, `admin-payment-orders`)

### 5) Chặn học khóa có phí trước khi admin xác nhận
- `OnlineLearningWeb/js/course-watch.js`:
  - Khóa **miễn phí (`price <= 0`)**: học ngay
  - Khóa **trả phí (`price > 0`)**: chỉ học khi đã có enrollment (sau xác nhận admin) hoặc là ADMIN

---

## Chạy dự án (hướng A: xem khóa học + giỏ đăng ký)

1. **Backend** (`backend/`):
   - Copy `backend/.env.example` → `backend/.env`, điền `MONGODB_URI` (Atlas), `JWT_SECRET`, `PORT` (mặc định 3001), và **SMTP** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, …) nếu dùng quên mật khẩu/OTP. Kiểm tra gửi mail: `cd backend` → `npm run test:smtp`.
   - `cd backend`
   - `npm install`
   - `npm run seed:roles` (tạo role `ADMIN` / `USER`)
   - `npm run dev` hoặc `npm start`

2. **Mở web**: trình duyệt vào **`http://localhost:3001/`** (không mở file HTML trực tiếp bằng `file://` vì API cùng origin).

3. **Luồng dùng**:
   - `index.html` — đăng ký (`POST /api/auth/register`)
   - `login.html` — đăng nhập (lưu token + cookie)
   - `course.html` — danh sách khóa học từ MongoDB (`GET /api/courses`), nút **Thêm vào giỏ**
   - `cart.html` — giỏ đăng ký: **Xóa** (`POST /api/carts/remove`), **-1** (`POST /api/carts/reduce`)

4. **Dữ liệu admin**: tạo khóa học qua API `POST /api/courses` (cần user `ADMIN` + token), hoặc Compass/Atlas insert thủ công nếu cần demo.

---

## Frontend

Thư mục `OnlineLearningWeb/` là template HTML tĩnh; đã nối:
- `js/api.js` — gọi `/api/*` cùng origin, `credentials: 'include'`
- `js/course-list.js`, `js/cart-page.js`, `js/index-register.js`, `js/login-page.js`

