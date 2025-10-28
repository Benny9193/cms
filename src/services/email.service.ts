import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!process.env.SMTP_USER) {
      console.log('SMTP not configured. Email would have been sent:', options);
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <h1>Welcome to our CMS, ${name}!</h1>
      <p>Thank you for joining our platform. We're excited to have you here.</p>
      <p>You can now start creating amazing content.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy writing!</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to CMS!',
      html,
      text: `Welcome to our CMS, ${name}! Thank you for joining our platform.`,
    });
  }

  async sendCommentNotification(
    authorEmail: string,
    postTitle: string,
    commenterName: string,
    commentContent: string
  ): Promise<void> {
    const html = `
      <h1>New Comment on Your Post</h1>
      <p>Hi there!</p>
      <p><strong>${commenterName}</strong> just commented on your post "<strong>${postTitle}</strong>":</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 20px 0;">
        ${commentContent}
      </blockquote>
      <p>Log in to your dashboard to moderate this comment.</p>
    `;

    await this.sendEmail({
      to: authorEmail,
      subject: `New comment on "${postTitle}"`,
      html,
      text: `${commenterName} commented on "${postTitle}": ${commentContent}`,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <p style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        If the button doesn't work, copy and paste this URL into your browser:<br>
        ${resetUrl}
      </p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  async sendPostPublishedNotification(
    subscriberEmail: string,
    postTitle: string,
    postExcerpt: string,
    postUrl: string
  ): Promise<void> {
    const html = `
      <h1>New Post Published!</h1>
      <h2>${postTitle}</h2>
      <p>${postExcerpt}</p>
      <p style="margin: 30px 0;">
        <a href="${postUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Read More
        </a>
      </p>
    `;

    await this.sendEmail({
      to: subscriberEmail,
      subject: `New Post: ${postTitle}`,
      html,
      text: `New post published: ${postTitle}. Read it here: ${postUrl}`,
    });
  }
}

export default new EmailService();
