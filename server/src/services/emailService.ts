import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Without SMTP configured (local development), the reset link is printed to
// the server console so the flow can still be exercised end-to-end.
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email disabled] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await mailer.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'Reset your ContentIQ AI password',
    text: `Hi ${name},\n\nUse the link below to reset your password. It expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>Use the button below to reset your password. It expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.</p>
<p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
<p style="color:#64748b;font-size:12px">If you didn't request this, you can ignore this email.</p>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
