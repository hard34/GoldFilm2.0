const nodemailer = require("nodemailer");
const config = require("config");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.get("MAIL_HOST"),
      port: config.get("MAIL_PORT"),
      secure: false,
      auth: {
        user: config.get("MAIL_AUTH_USER"),
        pass: config.get("MAIL_AUTH_PASSWORD"),
      },
    });
  }
  async sendMail(email, code) {
    try {
      console.log('Attempting to send email to:', email);
      console.log('Using SMTP settings:', {
        host: config.get("MAIL_HOST"),
        port: config.get("MAIL_PORT"),
        user: config.get("MAIL_AUTH_USER")
      });
      
      const info = await this.transporter.sendMail({
        from: config.get("MAIL_AUTH_USER"),
        to: email,
        subject: "Подтверждение регистрации на Кинотеатр",
        text: `Здравствуйте!\n\nВы зарегистрировались на сайте Кинотеатр. Ваш код подтверждения: ${code}\n\nЕсли вы не регистрировались, просто проигнорируйте это письмо.\n\nС уважением, команда Кинотеатр`,
        html: `
          <div style=\"font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#181818;border-radius:12px;color:#fff\">
            <h1 style=\"color:#ffd700\">Здравствуйте!</h1>
            <p>Вы зарегистрировались на сайте <b>GoldenMovie</b>.</p>
            <p>Ваш код подтверждения:</p>
            <div style=\"font-size:2rem;font-weight:bold;color:#ffd700;margin:16px 0;letter-spacing:2px;\">${code}</div>
            <p>Если вы не регистрировались, просто проигнорируйте это письмо.</p>
            <br>
            <p style=\"color:#888;font-size:0.95rem\">С уважением, команда GoldenMovie</p>
          </div>
        `,
      });
      
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

module.exports = new MailService();
