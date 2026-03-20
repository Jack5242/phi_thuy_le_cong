import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"thủy phí lê công" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "thủy phí lê công - Mã Xác Nhận Đăng Ký",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Chào mừng bạn đến với thủy phí lê công</h2>
          <p>Mã xác nhận đăng ký tài khoản của bạn là:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-radius: 5px; display: inline-block;">
            ${code}
          </div>
          <p>Mã này sẽ hết hạn trong 15 phút.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        </div>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export const sendPasswordResetEmail = async (email: string, link: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"thủy phí lê công" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "thủy phí lê công - Khôi Phục Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Yêu cầu Khôi Phục Mật Khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản thủy phí lê công.</p>
          <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Đặt Lại Mật Khẩu
          </a>
          <p>Hoặc copy đường dẫn này: <a href="${link}">${link}</a></p>
          <p>Đường dẫn này sẽ hết hạn trong 1 giờ.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn sẽ được giữ nguyên.</p>
        </div>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

export const sendFeedbackRequestEmail = async (email: string, orderId: string) => {
  // In a real app, use the actual domain.
  const appDomain = process.env.APP_URL || 'http://localhost:5173';
  const feedbackLink = `${appDomain}/?view=feedback&orderId=${orderId}`;

  try {
    const info = await transporter.sendMail({
      from: `"thủy phí lê công" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "thủy phí lê công - Đánh Giá Đơn Hàng Của Bạn",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Cảm ơn bạn đã mua sắm tại thủy phí lê công!</h2>
          <p>Đơn hàng <strong>${orderId}</strong> của bạn đã được ghi nhận.</p>
          <p>Chúng tôi rất trân trọng ý kiến đóng góp của bạn để cải thiện chất lượng dịch vụ và sản phẩm. Xin vui lòng dành ít phút để đánh giá trải nghiệm mua sắm của bạn:</p>
          <a href="${feedbackLink}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Để Lại Đánh Giá
          </a>
          <p>Hoặc truy cập: <a href="${feedbackLink}">${feedbackLink}</a></p>
          <p>Chân thành cảm ơn sự ủng hộ của bạn!</p>
        </div>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending feedback email:", error);
  }
};

export const sendWelcomeVoucherEmail = async (email: string, voucherCode: string, discount: number, type: string) => {
  const discountDisplay = type === 'percent' ? `${discount * 100}%` : `${discount.toLocaleString()} đ`;
  
  try {
    const info = await transporter.sendMail({
      from: `"thủy phí lê công" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "thủy phí lê công - Quà Tặng Chào Mừng Thành Viên Mới",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
          <h2 style="color: #0f5132; text-align: center;">Chào Mừng Bạn Đến Với thủy phí lê công!</h2>
          <p>Cảm ơn bạn đã đăng ký trở thành thành viên của gia đình thủy phí lê công. Để chào mừng bạn, chúng tôi xin gửi tặng bạn một mã giảm giá đặc biệt:</p>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0fdf4; border: 2px dashed #15803d; border-radius: 10px;">
            <p style="margin: 0; color: #15803d; font-weight: bold; text-transform: uppercase;">Mã Giảm Giá Của Bạn</p>
            <div style="font-size: 32px; font-weight: 800; color: #064e3b; margin: 10px 0;">${voucherCode}</div>
            <p style="margin: 0; color: #065f46; font-size: 18px;">Giảm ngay <strong>${discountDisplay}</strong> cho đơn hàng đầu tiên</p>
          </div>
          
          <p style="font-size: 14px; color: #666;">* Mã giảm giá này chỉ dành riêng cho tài khoản của bạn và có hiệu lực cho 1 lần sử dụng duy nhất.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 12px 30px; background-color: #0f5132; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Mua Sắm Ngay
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua <a href="mailto:support@jade.example.com">support@jade.example.com</a>.
          </p>
        </div>
      `,
    });
    console.log("Welcome voucher email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome voucher email:", error);
  }
};
