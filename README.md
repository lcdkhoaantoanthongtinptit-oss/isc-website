# Website Liên chi đoàn Khoa An toàn thông tin

Website chính thức của **Liên chi đoàn Khoa An toàn thông tin**, tích hợp cổng **tra cứu kết quả tuyển dụng Cộng tác viên (CTV)** bảo mật cao và hệ thống **Quản trị viên (Admin Portal)** toàn diện.

---

## 1. Công nghệ sử dụng

- **Frontend Core**: React 18, TypeScript, Vite
- **UI & Styling**: Ant Design v5 (Cyber Blue theme custom tokens), Lucide Icons, Canvas Confetti, Chart.js & React-ChartJS-2
- **Routing**: React Router v6
- **Xử lý Excel**: Thư viện `xlsx` (Import & Export định dạng `.xlsx`, validate lỗi theo từng dòng)
- **Backend as a Service (BaaS)**:
  - **Firebase Authentication**: Xác thực email/mật khẩu, kiểm tra Custom Claims (`role: admin`).
  - **Cloud Firestore**: Cơ sở dữ liệu NoSQL lưu trữ ứng viên, ban chuyên môn, hoạt động, ban chấp hành, cài đặt website.
  - **Firebase Storage**: Lưu trữ an toàn ảnh hoạt động, avatar ban chấp hành (kiểm tra MIME type `image/*`, dung lượng <= 5MB).
  - **Firebase Cloud Functions**: Hàm `checkCollaboratorResult` truy vấn bảo mật theo MSSV (không để lộ danh sách toàn bộ hay thông tin nhạy cảm), hàm `setAdminRole`.
  - **Firebase Hosting**: Triển khai frontend tốc độ cao.

---

## 2. Cấu trúc thư mục

```text
src/
├── assets/                  # Tài nguyên hình ảnh, biểu tượng
├── components/              # Các component dùng chung
├── layouts/                 # PublicLayout & AdminLayout
│   ├── PublicLayout.tsx
│   └── AdminLayout.tsx
├── pages/
│   ├── public/              # Trang công khai
│   │   ├── HomePage.tsx            # Trang chủ (Hero, Stats, Giá trị, Hoạt động, BCH, Tuyển CTV, Liên hệ)
│   │   ├── CheckResultPage.tsx     # Tra cứu kết quả CTV bảo mật + Hiệu ứng Confetti
│   │   ├── ActivitiesPage.tsx      # Danh sách sự kiện & bộ lọc chuyên mục
│   │   └── ActivityDetailPage.tsx  # Chi tiết sự kiện
│   └── admin/               # Trang quản trị
│       ├── LoginPage.tsx           # Đăng nhập Admin
│       ├── DashboardPage.tsx       # Tổng quan thống kê & biểu đồ Chart.js
│       ├── CollaboratorsPage.tsx   # Quản lý CTV (CRUD, Import/Export Excel, Drawer chi tiết)
│       ├── ActivitiesAdminPage.tsx # Quản lý hoạt động & upload ảnh Storage
│       ├── ExecutiveMembersPage.tsx# Quản lý Ban Chấp hành
│       └── SettingsPage.tsx        # Cài đặt nội dung Landing Page & Seed Data
├── routes/
│   ├── index.tsx            # Cấu hình routes công khai và bảo vệ
│   └── ProtectedRoute.tsx   # Route Guard kiểm tra quyền Admin qua Token Claims
├── services/
│   ├── firebase.ts          # Khởi tạo Firebase SDK & chế độ Dual Mode
│   ├── auth.service.ts      # Xác thực & phân quyền Admin
│   ├── collaborator.service.ts # Nghiệp vụ CTV, Firestore Batch Write
│   ├── activity.service.ts  # Nghiệp vụ hoạt động
│   ├── department.service.ts# Nghiệp vụ ban chuyên môn
│   ├── member.service.ts    # Nghiệp vụ Ban Chấp hành
│   ├── settings.service.ts  # Cấu hình website
│   ├── storage.service.ts   # Upload ảnh và kiểm tra bảo mật
│   ├── excel.service.ts     # Import validation từng dòng & Export file Excel
│   ├── seedService.ts       # Nạp dữ liệu mẫu vào Firestore
│   └── mockData.ts          # Dữ liệu khởi tạo chuẩn mực
├── theme/
│   └── themeConfig.ts       # Ant Design Cyber Blue tokens
├── types/
│   └── index.ts             # Định nghĩa kiểu dữ liệu TypeScript
├── index.css                # CSS Reset, Glassmorphism, Cyber patterns
├── main.tsx
└── App.tsx

functions/                   # Firebase Cloud Functions (TypeScript)
├── src/
│   └── index.ts             # checkCollaboratorResult, setAdminRole
├── package.json
└── tsconfig.json

firestore.rules              # Quy tắc bảo mật Firestore (Chặn public đọc collaborators)
storage.rules                # Quy tắc bảo mật Firebase Storage
firestore.indexes.json       # Composite indexes cho truy vấn
firebase.json                # Cấu hình Hosting, Firestore, Storage, Emulators
.env.example                 # Mẫu biến môi trường Firebase
README.md                    # Tài liệu hướng dẫn
```

---

## 3. Chế độ hoạt động thông minh (Dual Mode)

Dự án được thiết kế với kiến trúc **Dual Mode**:
1. **Chế độ Demo / Local Mode (Mặc định khi chưa có Firebase credentials)**:
   - Hệ thống tự động sử dụng kho dữ liệu mẫu phong phú: 5 Ban chuyên môn, 12 Cộng tác viên (với các mã sinh viên mẫu `B23DCAT001` - Trúng tuyển, `B23DCAT002` - Đang chờ, `B23DCAT003` - Không trúng tuyển), 6 hoạt động, 5 thành viên BCH.
   - Tài khoản Admin thử nghiệm: `admin@lcdattt.edu.vn` / `Admin@123` (có nút hỗ trợ điền nhanh trên trang đăng nhập).
   - Có thể kiểm thử toàn bộ tính năng: Tra cứu kết quả, hiệu ứng Confetti, xem Dashboard, thêm/sửa/xóa CTV, Import Excel (kiểm tra bắt lỗi từng dòng), Export Excel `.xlsx`.
2. **Chế độ Firebase Production Mode**:
   - Khi điền các biến môi trường thực tế vào file `.env`, hệ thống sẽ tự động chuyển sang kết nối trực tiếp với Firebase Authentication, Cloud Firestore, Firebase Storage và Cloud Functions.

---

## 4. Hướng dẫn cài đặt và chạy Frontend

### 4.1. Cài đặt thư viện

```bash
npm install
```

### 4.2. Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc từ `.env.example`:

```bash
cp .env.example .env
```

Điền thông tin cấu hình từ Firebase Console của bạn:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4.3. Khởi chạy Development Server

```bash
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:5173`

### 4.4. Kiểm tra Build Production

```bash
npm run build
```

---

## 5. Hướng dẫn thiết lập Firebase từ đầu

### Bước 1: Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo một project mới (ví dụ: `lcd-attt-project`).
2. Trong phần **Project Settings** -> **General** -> **Your apps**, thêm một Web App và copy các khóa cấu hình vào file `.env`.

### Bước 2: Bật Firebase Authentication
1. Chọn **Build** -> **Authentication** -> **Get Started**.
2. Trong tab **Sign-in method**, kích hoạt nhà cung cấp **Email/Password**.
3. Trong tab **Users**, thêm tài khoản Admin quản trị (ví dụ: `admin@lcdattt.edu.vn`).

### Bước 3: Tạo Cloud Firestore Database
1. Chọn **Build** -> **Firestore Database** -> **Create database**.
2. Chọn khu vực (Region) gần nhất (ví dụ: `asia-southeast1` - Singapore).
3. Bắt đầu ở chế độ **Production mode** (quy tắc bảo mật sẽ được deploy từ file `firestore.rules`).

### Bước 4: Tạo Cloud Storage
1. Chọn **Build** -> **Storage** -> **Get Started**.
2. Chọn khu vực lưu trữ tương ứng và hoàn tất.

### Bước 5: Cấp quyền Admin (Custom Claims)
Để bảo vệ hệ thống theo đúng tiêu chuẩn an ninh thông tin, tài khoản Admin cần được cấp Custom Claim `role: 'admin'`. Bạn có thể thực hiện bằng một trong hai cách:

**Cách 1: Sử dụng Cloud Function `setAdminRole`**
Gọi function `setAdminRole` với payload `{ "email": "admin@lcdattt.edu.vn" }`.

**Cách 2: Gán trực tiếp qua Node.js Firebase Admin SDK**
Tạo file script nhỏ:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();
admin.auth().getUserByEmail('admin@lcdattt.edu.vn').then(user => {
  return admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
}).then(() => console.log('Đã gán quyền Admin thành công!'));
```

**Cách 3: Thêm document vào collection `users`**
Tạo document tại `users/{uid_cua_admin}` với nội dung:
```json
{
  "role": "admin",
  "email": "admin@lcdattt.edu.vn"
}
```

---

## 6. Sử dụng Firebase Local Emulator Suite

Hệ thống đã cấu hình sẵn file `firebase.json` hỗ trợ đầy đủ bộ giả lập:

```bash
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Đăng nhập Firebase
firebase login

# Khởi chạy toàn bộ Emulators (Auth, Firestore, Functions, Storage, Hosting, UI)
firebase emulators:start
```

Giao diện quản lý trực quan Firebase Emulator UI sẽ mở tại: `http://localhost:4000`

---

## 7. Triển khai (Deployment)

### 7.1. Deploy Security Rules & Indexes

```bash
# Deploy quy tắc bảo mật Firestore và Storage
firebase deploy --only firestore:rules,storage

# Deploy các chỉ mục tìm kiếm tối ưu
firebase deploy --only firestore:indexes
```

### 7.2. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 7.3. Deploy Frontend lên Firebase Hosting

```bash
# Build mã nguồn ứng dụng
npm run build

# Deploy Hosting
firebase deploy --only hosting
```

Hoặc deploy toàn bộ dự án chỉ với một câu lệnh:
```bash
firebase deploy
```

---

## 8. Hướng dẫn sử dụng các tính năng chính

### 8.1. Tra cứu kết quả CTV (`/tra-cuu-ctv`)
- Nhập Mã sinh viên (ví dụ: `B23DCAT001`).
- Hệ thống gọi Cloud Function `checkCollaboratorResult` hoặc thực hiện truy vấn document trực tiếp theo ID.
- **Trúng tuyển (PASSED)**: Xuất hiện thẻ vinh danh nổi bật, thông tin Ban trúng tuyển, chức vụ, lời dặn dò và **hiệu ứng pháo hoa Confetti**.
- **Đang chờ (PENDING)**: Thông báo kết quả đang được cập nhật.
- **Không trúng tuyển (FAILED)**: Thư cảm ơn chân thành và động viên đồng hành cùng phong trào của Khoa.

### 8.2. Quản lý Cộng tác viên (`/admin/collaborators`)
- **Ant Design Table**: Hỗ trợ tìm kiếm realtime theo tên/MSSV/email, lọc theo Ban chuyên môn, lọc theo Trạng thái (Trúng tuyển, Đang chờ, Không trúng tuyển), sắp xếp cột và phân trang.
- **CRUD**: Thêm mới ứng viên, chỉnh sửa thông tin, xóa hồ sơ với Modal xác nhận an toàn, xem chi tiết đầy đủ (kèm SĐT và Ghi chú nội bộ Admin) qua Drawer.
- **Import Excel**:
  - Nhấp nút "Tải mẫu Excel" để nhận file mẫu định dạng chuẩn.
  - Tải lên file `.xlsx`. Hệ thống tự động phân tích và validate từng dòng (kiểm tra trùng MSSV, sai email, thiếu cột bắt buộc, ban không tồn tại).
  - Hiển thị danh sách lỗi cụ thể (ví dụ: `Dòng 12: Mã sinh viên đã tồn tại`).
  - Xem trước dữ liệu hợp lệ và ghi dữ liệu hàng loạt bằng **Firestore Batch Write**.
- **Export Excel**: Xuất file `Danh_sach_CTV.xlsx` theo dữ liệu đang lọc, toàn bộ danh sách hoặc theo trạng thái trúng tuyển.

### 8.3. Quản lý Hoạt động & Ban Chấp hành
- Upload ảnh bìa sự kiện và avatar BCH trực tiếp lên Firebase Storage (tự động kiểm tra định dạng và nén/giới hạn dung lượng <= 5MB).
- Bật/tắt ghim bài viết Nổi bật và hiển thị Công khai.

### 8.4. Cài đặt Landing Page (`/admin/settings`)
- Thay đổi thông điệp Hero, Slogan, số liệu thống kê sinh viên, thông tin liên hệ ngay trên giao diện quản trị mà không cần sửa code.
- Nút tiện ích **Nạp dữ liệu mẫu (Seed Data)** giúp khởi tạo toàn bộ database mẫu vào Firestore chỉ với 1 click.
