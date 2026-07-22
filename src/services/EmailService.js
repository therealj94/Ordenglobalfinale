const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.enabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  async send(to, subject, html) {
    if (!this.enabled) {
      console.log(`[EmailService] Skipped (not configured). Would send to ${to}: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error.message);
    }
  }

  async sendVerificationApproved(user) {
    await this.send(
      user.email,
      'Your identity has been verified — GENESIS ID',
      `<h2>You're verified! ✅</h2>
       <p>Hi ${user.fullName || ''},</p>
       <p>Your identity verification was approved. You now have access to all Orden Global ecosystem apps.</p>`
    );
  }

  async sendVerificationRejected(user, reason) {
    await this.send(
      user.email,
      'Update on your identity verification — GENESIS ID',
      `<h2>Verification not approved</h2>
       <p>Hi ${user.fullName || ''},</p>
       <p>We were unable to verify your identity. Reason: ${reason || 'Documents unclear or invalid.'}</p>
       <p>You can try again from your account.</p>`
    );
  }
}

module.exports = new EmailService();
