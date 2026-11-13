# Hệ Thống Quản Lý Bài Báo Khoa Học (SRH Portal)

Hệ thống quản lý xuất bản khoa học trực tuyến được thiết kế theo kiến trúc **Decoupled Architecture (Client-Server)**, ứng dụng mô hình trang đơn (SPA) nhằm số hóa và tối ưu hóa toàn bộ quy trình từ khâu nộp bản thảo, phản biện kín (Blind Peer Review) đến khi xuất bản chính thức.

![Dự án Demo](https://placehold.co/1000x400/579799/ffffff?text=SRH+Portal+-+Journal+Management+System&font=montserrat)

---

## Công Nghệ Sử Dụng (Tech Stack)

### Tầng Giao Diện (Frontend - SPA)
* **Framework:** React.js (phiên bản 18+) kết hợp công cụ build Vite.
* **Tùy biến Giao diện:** Tailwind CSS (Utility-first framework).
* **Biểu đồ & Thống kê:** Recharts.
* **Giao tiếp API:** Axios.
* **Tính năng khác:** `html2pdf.js` (Xuất PDF bài báo), `jwt-decode` (Xử lý chuỗi Token từ Google OAuth).

### Tầng Xử Lý (Backend - RESTful API)
* **Framework:** Laravel 11.x (PHP).
* **Cơ sở dữ liệu:** MySQL (Thiết kế chuẩn hóa Normalization).
* **Xác thực (Authentication):** Laravel Sanctum (Token-based) & Phân quyền RBAC.
* **Real-time:** Laravel Echo & Pusher (cho tính năng chuông thông báo và chat nhóm).

---

## Các Tính Năng Nổi Bật

### 1. Phân quyền RBAC Triệt để
Hệ thống thiết lập 3 vùng không gian làm việc cô lập:
* **Tác giả (Author):** Giao diện quản lý bản thảo cá nhân, nộp bài viết mới, theo dõi trạng thái phê duyệt.
* **Thẩm định viên (Reviewer):** Tiếp nhận bài viết ẩn danh (Blind Review), đánh giá theo tiêu chí và nộp báo cáo độc lập.
* **Quản trị viên (Admin):** Bảng điều khiển tổng (Sơ duyệt, phân công phản biện, ra quyết định xuất bản, quản lý người dùng và cấp quyền).

### 2. Trình Soạn Thảo Độc Quyền (RichTextBlock)
* **Không dùng thư viện bên thứ 3:** Tự phát triển module soạn thảo can thiệp sâu vào `contentEditable`.
* **Block-based:** Hỗ trợ chèn xen kẽ khối văn bản, hình ảnh, và video một cách linh hoạt.
* **Bảo mật:** Tích hợp bộ lọc "Remove Format" chống XSS, dọn dẹp thẻ HTML rác khi copy-paste từ MS Word.

### 3. Tương Tác & Tiện Ích Học Thuật
* **Bình luận đa tầng (Nested Comments):** Hỗ trợ đính kèm hình ảnh/tệp tin trong quá trình thảo luận bài báo.
* **Trích xuất PDF:** Tự động định dạng lại bài báo và xuất ra file PDF theo chuẩn trình bày tạp chí.
* **Trích dẫn tự động:** Tích hợp sinh mã trích dẫn theo 3 chuẩn phổ biến: APA, IEEE, Harvard.

### 4. Quản trị & Báo Cáo Chuyên Sâu
* Biểu đồ trực quan hóa dữ liệu bằng **Recharts** (tỷ lệ duyệt bài, top bài đọc nhiều, biến động theo thời gian).
* Hỗ trợ xuất dữ liệu báo cáo ra file Excel (`.CSV`) và in ấn PDF hành chính chuẩn Quốc hiệu.

---

## Hướng Dẫn Cài Đặt (Local Development)

Dự án được chia làm 2 thư mục độc lập: `ql-baibao-frontend` (React) và `ql-baibao-backend` (Laravel).

### 1. Khởi chạy Backend (Laravel API)
Yêu cầu môi trường: PHP >= 8.2, Composer, MySQL.

```bash
cd ql-baibao-backend
cp .env.example .env
# Chỉnh sửa file .env để kết nối database MySQL (DB_DATABASE, DB_USERNAME, DB_PASSWORD)

composer install
php artisan key:generate
php artisan migrate --seed # Tạo bảng và nạp dữ liệu mẫu
php artisan storage:link   # Liên kết thư mục chứa ảnh/video

php artisan serve
# Backend sẽ chạy tại: [http://127.0.0.1:8000](http://127.0.0.1:8000)
