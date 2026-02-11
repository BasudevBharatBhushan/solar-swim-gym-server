
import nodemailer from 'nodemailer';
import { getEmailConfigByLocationId } from './emailConfig.service';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  location_id: string; // Used to fetch the correct SMTP config
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { to, subject, html, text, location_id } = options;

  if (!location_id) {
    throw new Error('Location ID is required to fetch email configuration');
  }

  // 1. Fetch SMTP Config for this location
  const config = await getEmailConfigByLocationId(location_id);

  if (!config || !config.is_active) {
    console.warn(`No active email configuration found for location ${location_id}. Email not sent.`);
    // In production, you might want to throw an error or log this to a monitoring service
    // For now, throwing error so the caller knows it failed
    throw new Error('Email configuration not found or inactive for this location.');
  }

  // 2. Create Transporter
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.is_secure, // true for 465, false for other ports
    auth: {
      user: config.smtp_username,
      pass: config.smtp_password,
    },
  });

  // 3. Send Email
  try {
    const info = await transporter.sendMail({
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to,
      subject,
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export default {
  sendEmail,
};
