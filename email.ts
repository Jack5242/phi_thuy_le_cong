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
      from: `"Jade Elegance" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "Jade Elegance - Mã Xác Nhận Đăng Ký",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Chào mừng bạn đến với Jade Elegance</h2>
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
      from: `"Jade Elegance" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "Jade Elegance - Khôi Phục Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Yêu cầu Khôi Phục Mật Khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Jade Elegance.</p>
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
      from: `"Jade Elegance" <${process.env.FROM_EMAIL || 'no-reply@jade.example.com'}>`,
      to: email,
      subject: "Jade Elegance - Đánh Giá Đơn Hàng Của Bạn",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0f5132;">Cảm ơn bạn đã mua sắm tại Jade Elegance!</h2>
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
