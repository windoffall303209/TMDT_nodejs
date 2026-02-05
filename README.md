# WIND OF FALL - Fashion E-commerce

Website bán hàng thời trang đầy đủ tính năng, xây dựng với Node.js, Express, MySQL và EJS.

## Tính năng

### Khách hàng
- Đăng ký / Đăng nhập với JWT
- Xác thực email bằng mã 6 số
- Quên mật khẩu với mã xác nhận qua email
- Tìm kiếm sản phẩm (fuzzy search)
- Giỏ hàng lưu trữ vĩnh viễn (không mất khi đóng trình duyệt)
- Mã giảm giá (Voucher)
- Thanh toán: COD, VNPay, MoMo
- Quản lý đơn hàng và địa chỉ giao hàng
- Đăng ký nhận thông báo khuyến mãi (Newsletter)

### Admin
- Dashboard thống kê
- Quản lý sản phẩm, danh mục, khuyến mãi
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý voucher
- Quản lý banner
- Gửi email marketing

### Bảo mật
- Mật khẩu hash với bcrypt
- JWT authentication
- Helmet.js security headers
- SQL injection protection

## Yêu cầu

- Node.js >= 14.x
- MySQL >= 5.7
- npm hoặc yarn

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd TMDT_nodejs
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo database

```bash
mysql -u root -p < database/schema.sql
```

### 4. Import dữ liệu mẫu (tùy chọn)

```bash
mysql -u root -p tmdt_ecommerce < database/seed.sql
```

**Tài khoản admin mặc định:**
- Email: `admin@fashionstore.vn`
- Password: `admin123`

### 5. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:

```env
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tmdt_ecommerce
DB_PORT=3306

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h

# Session
SESSION_SECRET=your_session_secret

# Email - Gmail (fallback)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=your_email@gmail.com

# Email - Resend (primary - recommended for production)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Your Store <onboarding@resend.dev>
USE_RESEND=true

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
USE_CLOUDINARY=true

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public/uploads

# Payment (optional)
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay/callback

MOMO_PARTNER_CODE=your_momo_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:3000/payment/momo/callback
MOMO_NOTIFY_URL=http://localhost:3000/payment/momo/notify
```

### 6. Tạo thư mục uploads

```bash
mkdir -p public/uploads
```

### 7. Chạy ứng dụng

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Truy cập: http://localhost:3000

## Cấu hình Email

### Resend (Khuyến nghị cho Production)

1. Đăng ký tại [resend.com](https://resend.com)
2. Lấy API Key từ Dashboard
3. Cấu hình trong `.env`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Your Store <onboarding@resend.dev>
USE_RESEND=true
```

**Lưu ý:** Để gửi email từ domain riêng, cần xác minh domain tại Resend Dashboard.

### Gmail (Fallback)

1. Bật xác minh 2 bước trong Google Account
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Sử dụng App Password trong `MAIL_PASS`

**Cơ chế hoạt động:**
- Nếu `USE_RESEND=true`: Ưu tiên Resend, fallback sang Gmail nếu thất bại
- Nếu `USE_RESEND=false`: Chỉ dùng Gmail

## Cấu hình Cloudinary (Image Storage)

1. Đăng ký tại [cloudinary.com](https://cloudinary.com)
2. Lấy thông tin từ Dashboard
3. Cấu hình trong `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
USE_CLOUDINARY=true
```

**Cơ chế hoạt động:**
- Ảnh luôn được lưu local trước (`public/uploads/`)
- Nếu `USE_CLOUDINARY=true`: Đồng thời upload lên Cloudinary
- URL hiển thị ưu tiên Cloudinary (CDN nhanh hơn), fallback local nếu cloud fail

## Cấu trúc thư mục

```
TMDT_nodejs/
├── config/
│   ├── database.js          # Kết nối MySQL
│   └── cloudinary.js        # Cấu hình Cloudinary
├── controllers/
│   ├── authController.js    # Xác thực, đăng ký, đăng nhập
│   ├── productController.js # Sản phẩm, tìm kiếm
│   ├── cartController.js    # Giỏ hàng
│   ├── orderController.js   # Đơn hàng, thanh toán
│   └── adminController.js   # Quản trị
├── models/
│   ├── User.js              # Model người dùng
│   ├── Product.js           # Model sản phẩm
│   ├── Cart.js              # Model giỏ hàng
│   └── Order.js             # Model đơn hàng
├── routes/
│   ├── authRoutes.js        # Routes xác thực
│   ├── productRoutes.js     # Routes sản phẩm
│   └── adminRoutes.js       # Routes admin
├── middleware/
│   ├── auth.js              # JWT middleware
│   └── upload.js            # Multer + Cloudinary
├── services/
│   ├── emailService.js      # Resend + Gmail
│   └── paymentService.js    # VNPay, MoMo
├── views/
│   ├── partials/            # Header, footer, components
│   ├── home/                # Trang chủ
│   ├── products/            # Danh sách, chi tiết sản phẩm
│   ├── auth/                # Đăng nhập, đăng ký
│   └── admin/               # Trang quản trị
├── public/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript
│   └── uploads/             # Ảnh upload local
├── database/
│   ├── schema.sql           # Cấu trúc database
│   └── seed.sql             # Dữ liệu mẫu
├── .env                     # Biến môi trường
├── package.json
└── server.js                # Entry point
```

## Database Schema

| Bảng | Mô tả |
|------|-------|
| users | Người dùng (xác thực email, reset password) |
| categories | Danh mục sản phẩm |
| products | Sản phẩm |
| product_images | Ảnh sản phẩm |
| product_variants | Biến thể (size, màu) |
| sales | Chương trình khuyến mãi |
| vouchers | Mã giảm giá |
| voucher_usage | Lịch sử sử dụng voucher |
| cart | Giỏ hàng |
| cart_items | Sản phẩm trong giỏ |
| addresses | Địa chỉ giao hàng |
| orders | Đơn hàng |
| order_items | Chi tiết đơn hàng |
| payments | Thanh toán |
| reviews | Đánh giá sản phẩm |
| wishlist | Sản phẩm yêu thích |
| banners | Banner quảng cáo |
| newsletter_subscribers | Đăng ký nhận tin |
| email_campaigns | Chiến dịch email |

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập |
| GET | /auth/logout | Đăng xuất |
| GET | /auth/profile | Xem hồ sơ |
| POST | /auth/send-verification | Gửi mã xác thực email |
| POST | /auth/verify-email | Xác thực email |
| POST | /auth/forgot-password/send-code | Gửi mã reset password |
| POST | /auth/forgot-password/verify-code | Xác thực mã reset |
| POST | /auth/forgot-password/reset | Đặt lại mật khẩu |

### Products
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /products | Danh sách sản phẩm |
| GET | /products/:slug | Chi tiết sản phẩm |
| GET | /products/search?q=keyword | Tìm kiếm |

### Cart
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /cart | Xem giỏ hàng |
| POST | /cart/add | Thêm vào giỏ |
| POST | /cart/update | Cập nhật số lượng |
| POST | /cart/remove | Xóa sản phẩm |

### Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /orders/checkout | Trang thanh toán |
| POST | /orders/create | Tạo đơn hàng |
| GET | /orders/history | Lịch sử đơn hàng |

### Newsletter
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /newsletter/subscribe | Đăng ký nhận tin |
| GET | /newsletter/status | Kiểm tra trạng thái |

### Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /admin/dashboard | Dashboard |
| GET | /admin/products | Quản lý sản phẩm |
| POST | /admin/products | Thêm sản phẩm |
| PUT | /admin/products/:id | Cập nhật sản phẩm |
| DELETE | /admin/products/:id | Xóa sản phẩm |
| GET | /admin/orders | Quản lý đơn hàng |
| PUT | /admin/orders/:id/status | Cập nhật trạng thái đơn |
| GET | /admin/users | Quản lý người dùng |
| GET | /admin/vouchers | Quản lý voucher |
| GET | /admin/banners | Quản lý banner |
| GET | /admin/sales | Quản lý khuyến mãi |

## Deploy lên Render

### 1. Tạo Web Service

1. Kết nối GitHub repository
2. Chọn branch để deploy
3. Build Command: `npm install`
4. Start Command: `npm start`

### 2. Cấu hình Environment Variables

Thêm các biến môi trường sau vào Render Dashboard:

```
NODE_ENV=production
PORT=3000
BASE_URL=https://your-app.onrender.com

# Database (sử dụng external MySQL service)
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=tmdt_ecommerce
DB_PORT=3306

# JWT & Session
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret

# Email (Resend recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Your Store <onboarding@resend.dev>
USE_RESEND=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
USE_CLOUDINARY=true

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public/uploads
```

### 3. Lưu ý quan trọng

- **Database**: Render không có MySQL, sử dụng external service như PlanetScale, Railway, hoặc Aiven
- **File uploads**: Render có ephemeral filesystem, file sẽ bị xóa khi redeploy. Sử dụng Cloudinary để lưu ảnh
- **Email**: Gmail có thể bị chặn trên Render, sử dụng Resend để đảm bảo email hoạt động

## Troubleshooting

### Lỗi kết nối database
```
Error: ER_ACCESS_DENIED_ERROR
```
Kiểm tra `DB_USER` và `DB_PASSWORD` trong `.env`

### Lỗi gửi email
```
Error: Invalid login
```
- Đảm bảo sử dụng App Password của Gmail
- Hoặc chuyển sang Resend với `USE_RESEND=true`

### Lỗi upload file
```
Error: ENOENT: no such file or directory
```
Tạo thư mục `public/uploads`

### Email không gửi được trên Render
- Gmail có thể bị chặn do IP không tin cậy
- Chuyển sang Resend: đặt `USE_RESEND=true` và cấu hình `RESEND_API_KEY`

### Ảnh bị mất sau khi redeploy
- Render có ephemeral filesystem
- Bật Cloudinary: đặt `USE_CLOUDINARY=true` và cấu hình Cloudinary credentials

## Công nghệ sử dụng

| Loại | Công nghệ |
|------|-----------|
| Backend | Node.js, Express.js (MVC) |
| Database | MySQL |
| Template | EJS |
| Auth | JWT, bcrypt |
| Email | Resend (primary), Nodemailer + Gmail (fallback) |
| Image Storage | Cloudinary (cloud), Multer (local) |
| Payment | VNPay, MoMo |
| Security | Helmet.js, CORS |

## License

ISC
