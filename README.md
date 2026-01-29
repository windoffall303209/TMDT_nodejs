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

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tmdt_ecommerce

# JWT
JWT_SECRET=your_secret_key_here

# Session
SESSION_SECRET=your_session_secret

# Email (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Payment (tùy chọn)
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
MOMO_PARTNER_CODE=your_momo_code
MOMO_SECRET_KEY=your_momo_secret
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

## Cấu hình Email (Gmail)

1. Bật xác minh 2 bước trong Google Account
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Sử dụng App Password trong `EMAIL_PASSWORD`

## Cấu trúc thư mục

```
TMDT_nodejs/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   └── adminController.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── adminRoutes.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── services/
│   ├── emailService.js
│   └── paymentService.js
├── views/
│   ├── partials/
│   ├── home/
│   ├── products/
│   ├── auth/
│   └── admin/
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .env
├── package.json
└── server.js
```

## Database Schema

File `database/schema.sql` bao gồm các bảng:

| Bảng | Mô tả |
|------|-------|
| users | Người dùng (bao gồm xác thực email, reset password) |
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
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `GET /auth/profile` - Xem hồ sơ
- `POST /auth/send-verification` - Gửi mã xác thực email
- `POST /auth/verify-email` - Xác thực email
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Đặt lại mật khẩu

### Products
- `GET /products` - Danh sách sản phẩm
- `GET /products/:slug` - Chi tiết sản phẩm
- `GET /products/search?q=keyword` - Tìm kiếm

### Cart
- `GET /cart` - Xem giỏ hàng
- `POST /cart/add` - Thêm vào giỏ
- `POST /cart/update` - Cập nhật số lượng
- `POST /cart/remove` - Xóa sản phẩm

### Orders
- `GET /orders/checkout` - Trang thanh toán
- `POST /orders/create` - Tạo đơn hàng
- `GET /orders/history` - Lịch sử đơn hàng

### Newsletter
- `POST /newsletter/subscribe` - Đăng ký nhận tin
- `GET /newsletter/status` - Kiểm tra trạng thái

### Admin
- `GET /admin/dashboard` - Dashboard
- `GET /admin/products` - Quản lý sản phẩm
- `GET /admin/orders` - Quản lý đơn hàng
- `GET /admin/users` - Quản lý người dùng
- `GET /admin/vouchers` - Quản lý voucher

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
Đảm bảo sử dụng App Password của Gmail, không phải mật khẩu thường

### Lỗi upload file
```
Error: ENOENT: no such file or directory
```
Tạo thư mục `public/uploads`

## Công nghệ sử dụng

- **Backend**: Node.js, Express.js (MVC)
- **Database**: MySQL
- **Template**: EJS
- **Auth**: JWT, bcrypt
- **Email**: Nodemailer + Gmail SMTP
- **Payment**: VNPay, MoMo
- **Upload**: Multer
- **Security**: Helmet.js, CORS

## License

ISC
