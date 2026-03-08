import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

/**
 * Send verification email with link to verify account
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} verificationToken - Secure token for verification
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(email, firstName, verificationToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Touri" <noreply@touri.com>',
    to: email,
    subject: 'Verify your Touri account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0D4A3A;">Welcome to Touri!</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationLink}" style="background: linear-gradient(to right, #0D4A3A, #3CC9A0); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #0D4A3A; word-break: break-all; font-size: 12px;">${verificationLink}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">© Touri</p>
      </div>
    `,
  };

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    await transporter.sendMail(mailOptions);
  } else {
    // Development: log the link instead of sending
    console.log('\n📧 [DEV] Verification email (SMTP not configured):');
    console.log(`   To: ${email}`);
    console.log(`   Link: ${verificationLink}\n`);
  }
}
