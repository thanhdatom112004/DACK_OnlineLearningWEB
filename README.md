# DACK_OnlineLearningWEB

## Cập nhật gần đây (enrollment + quiz)

Xem chi tiết trong **[CAP-NHAT-ENROLLMENT-QUIZ.md](./CAP-NHAT-ENROLLMENT-QUIZ.md)** (middleware enrollment, route quiz, `course-watch.js`, hướng dẫn kiểm tra).

---

## Chạy dự án (hướng A: xem khóa học + giỏ đăng ký)

1. **Backend** (`backend/`):
   - Copy `backend/.env.example` → `backend/.env`, điền `MONGODB_URI` (Atlas), `JWT_SECRET`, `PORT` (mặc định 3001).
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

