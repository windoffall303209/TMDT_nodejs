# Fashion Store - E-commerce Website

Một website bán hàng thời trang quần áo đầy đủ tính năng, được xây dựng với Node.js, Express, MySQL, và EJS.

## 🚀 Tính năng

### Khách hàng
- ✅ Đăng ký/Đăng nhập với bảo mật JWT
- ✅ Tìm kiếm sản phẩm (bảo vệ khỏi SQL injection)
- ✅ Giỏ hàng lưu trữ vĩnh viễn (như Shopee - không mất data)
- ✅ Nhiều phương thức thanh toán:
  - COD (Thanh toán khi nhận hàng)
  - VNPay
  - MoMo with QR Code
- ✅ Xem lịch sử đơn hàng
- ✅ Quản lý địa chỉ giao hàng

### Admin
- ✅ Dashboard với thống kê
- ✅ Quản lý sản phẩm (CRUD, upload ảnh)
- ✅ Quản lý đơn hàng
- ✅ Quản lý người dùng
- ✅ Quản lý banner & sale
- ✅ Gửi email marketing tự động

### Bảo mật
- ✅ Mật khẩu hash với bcrypt
- ✅ JWT authentication
- ✅ Chống SQL injection với parameterized queries
- ✅ Helmet.js cho security headers

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js + Express.js (MVC pattern)
- **Database**: MySQL with mysql2
- **Template Engine**: EJS
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer + Gmail
- **Payment**: VNPay, MoMo
- **Upload**: Multer

## 📋 Yêu cầu hệ thống

- Node.js >= 14.x
- MySQL >= 5.7
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd TMDT_nodejs
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình database

Tạo database MySQL:

```bash
mysql -u root -p
```

Sau đó chạy:

```sql
source database/schema.sql
```

Hoặc import trực tiếp:

```bash
mysql -u root -p < database/schema.sql
```

### 4. Tạo file `.env`

Copy `.env.example` thành `.env` và cập nhật thông tin:

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

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Payment (Optional - cần đăng ký tài khoản)
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
MOMO_PARTNER_CODE=your_momo_code
MOMO_SECRET_KEY=your_momo_secret
```

**Lưu ý về Gmail**: Bạn cần tạo App Password trong cài đặt Google Account để sử dụng Gmail SMTP.

### 5. Import dữ liệu mẫu (Optional)

```bash
mysql -u root -p tmdt_ecommerce < database/seed.sql
```

Tài khoản admin mặc định:
- Email: `admin@fashionstore.vn`
- Password: `admin123`

### 6. Tạo thư mục uploads

```bash
mkdir -p public/uploads
```

## 🚀 Chạy ứng dụng

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
TMDT_nodejs/
├── config/
│   └── database.js          # Cấu hình database
├── controllers/             # Controllers (MVC)
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   └── adminController.js
├── models/                  # Models (OOP)
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Order.js
│   └── ...
├── routes/                  # Routes
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   └── ...
├── middleware/              # Middleware
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload
├── services/                # Business logic
│   ├── emailService.js      # Email handling
│   └── paymentService.js    # Payment processing
├── views/                   # EJS templates
│   ├── layouts/
│   ├── partials/
│   ├── home/
│   ├── products/
│   ├── auth/
│   └── ...
├── public/                  # Static files
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── database/                # Database files
│   ├── schema.sql
│   └── seed.sql
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `GET /auth/profile` - Xem profile (requires auth)

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

### Admin (requires admin role)
- `GET /admin/dashboard` - Dashboard
- `GET /admin/products` - Quản lý sản phẩm
- `GET /admin/orders` - Quản lý đơn hàng
- `GET /admin/users` - Quản lý người dùng

## 💳 Cấu hình thanh toán

### VNPay
1. Đăng ký tại [VNPay Sandbox](https://sandbox.vnpayment.vn/)
2. Lấy TMN Code và Hash Secret
3. Cập nhật vào `.env`

### MoMo
1. Đăng ký tại [MoMo Developer](https://developers.momo.vn/)
2. Lấy Partner Code và Secret Key
3. Cập nhật vào `.env`

## 📧 Cấu hình Email

1. Bật 2-Step Verification trong Google Account
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Sử dụng App Password trong `.env`

## 🔒 Bảo mật

- Tất cả mật khẩu được hash với bcrypt (10 salt rounds)
- JWT tokens hết hạn sau 24h
- SQL injection protection với parameterized queries
- Helmet.js cho security headers
- CORS configuration

## 🐛 Troubleshooting

### Lỗi kết nối database
```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Giải pháp**: Kiểm tra lại `DB_USER` và `DB_PASSWORD` trong `.env`

### Lỗi gửi email
```bash
Error: Invalid login
```
**Giải pháp**: Đảm bảo sử dụng App Password, không phải mật khẩu Gmail thường

### Lỗi upload file
```bash
Error: ENOENT: no such file or directory
```
**Giải pháp**: Tạo thư mục `public/uploads`

## 📝 TODO

- [ ] Thêm tính năng đánh giá sản phẩm
- [ ] Thêm wishlist
- [ ] Thêm chat support
- [ ] Tối ưu hóa performance
- [ ] Thêm unit tests

## 👨‍💻 Phát triển

Để chạy ở chế độ development với auto-reload:

```bash
npm install -g nodemon
npm run dev
```

## 📄 License

ISC

## 👤 Tác giả

Fashion Store Team

## 🙏 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo pull request hoặc mở issue.
