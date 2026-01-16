const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        try {
            // Create transporter with Gmail
            this.transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            console.log('✅ Email service initialized');
        } catch (error) {
            console.warn('⚠️ Email service not available:', error.message);
            this.transporter = null;
        }
    }

    // Send welcome email on registration
    async sendWelcomeEmail(user) {
        if (!this.transporter) {
            console.warn('Email service not available, skipping welcome email');
            return;
        }
        
        const mailOptions = {
            from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Chào mừng đến với Fashion Store!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Xin chào ${user.full_name}!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại Fashion Store.</p>
                    <p>Chúng tôi rất vui khi bạn trở thành thành viên của cộng đồng thời trang của chúng tôi.</p>
                    <h3>Ưu đãi đặc biệt cho thành viên mới:</h3>
                    <ul>
                        <li>Giảm 10% cho đơn hàng đầu tiên</li>
                        <li>Miễn phí vận chuyển cho đơn từ 500.000đ</li>
                        <li>Tích điểm cho mỗi đơn hàng</li>
                    </ul>
                    <p>Bắt đầu mua sắm ngay hôm nay!</p>
                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">
                        Khám phá ngay
                    </a>
                    <br><br>
                    <p style="color: #666; font-size: 12px;">
                        Fashion Store - Cửa hàng thời trang hàng đầu Việt Nam<br>
                        123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh<br>
                        Hotline: 1900 123 456
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('✅ Welcome email sent to:', user.email);
        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
        }
    }

    // Send order confirmation email
    async sendOrderConfirmation(order) {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    <img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover;">
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.price.toLocaleString('vi-VN')}đ</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.subtotal.toLocaleString('vi-VN')}đ</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
            to: order.user_email,
            subject: `Xác nhận đơn hàng #${order.order_code}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Cảm ơn bạn đã đặt hàng!</h2>
                    <p>Xin chào ${order.user_name},</p>
                    <p>Đơn hàng của bạn đã được xác nhận thành công.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="margin: 0 0 10px 0;">Thông tin đơn hàng</h3>
                        <p><strong>Mã đơn hàng:</strong> ${order.order_code}</p>
                        <p><strong>Ngày đặt:</strong> ${new Date(order.created_at).toLocaleString('vi-VN')}</p>
                        <p><strong>Phương thức thanh toán:</strong> ${this.getPaymentMethodText(order.payment_method)}</p>
                    </div>

                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="margin: 0 0 10px 0;">Địa chỉ giao hàng</h3>
                        <p><strong>${order.shipping_name}</strong></p>
                        <p>${order.shipping_phone}</p>
                        <p>${order.address_line}, ${order.ward ? order.ward + ', ' : ''}${order.district ? order.district + ', ' : ''}${order.city}</p>
                    </div>

                    <h3>Chi tiết đơn hàng</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 10px; text-align: left;">Hình ảnh</th>
                                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                                <th style="padding: 10px; text-align: left;">SL</th>
                                <th style="padding: 10px; text-align: left;">Giá</th>
                                <th style="padding: 10px; text-align: left;">Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="margin-top: 20px; text-align: right;">
                        <p><strong>Tạm tính:</strong> ${order.total_amount.toLocaleString('vi-VN')}đ</p>
                        <p><strong>Phí vận chuyển:</strong> ${order.shipping_fee.toLocaleString('vi-VN')}đ</p>
                        <h3 style="color: #d32f2f;"><strong>Tổng cộng:</strong> ${order.final_amount.toLocaleString('vi-VN')}đ</h3>
                    </div>

                    <p style="margin-top: 30px;">Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.</p>
                    <p>Cảm ơn bạn đã tin tưởng Fashion Store!</p>

                    <br>
                    <p style="color: #666; font-size: 12px;">
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:<br>
                        Email: info@fashionstore.vn<br>
                        Hotline: 1900 123 456
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('✅ Order confirmation email sent to:', order.user_email);
        } catch (error) {
            console.error('❌ Error sending order confirmation email:', error);
        }
    }

    // Send marketing campaign email
    async sendMarketingEmail(users, campaign) {
        const promises = users.map(async user => {
            const mailOptions = {
                from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: campaign.subject,
                html: campaign.content.replace('{{name}}', user.full_name)
            };

            try {
                await this.transporter.sendMail(mailOptions);
                return { success: true, email: user.email };
            } catch (error) {
                console.error('Error sending to:', user.email, error);
                return { success: false, email: user.email };
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        
        console.log(`✅ Marketing email sent: ${successCount}/${users.length}`);
        return { total: users.length, success: successCount };
    }

    // Send password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Đặt lại mật khẩu - Fashion Store',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Đặt lại mật khẩu</h2>
                    <p>Xin chào ${user.full_name},</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #d32f2f; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Đặt lại mật khẩu
                    </a>
                    <p style="color: #666;">Link này sẽ hết hạn sau 1 giờ.</p>
                    <p style="color: #666;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent to:', user.email);
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
        }
    }

    // Helper method
    getPaymentMethodText(method) {
        const methods = {
            'cod': 'Thanh toán khi nhận hàng (COD)',
            'vnpay': 'VNPay',
            'momo': 'MoMo'
        };
        return methods[method] || method;
    }
}

module.exports = new EmailService();
