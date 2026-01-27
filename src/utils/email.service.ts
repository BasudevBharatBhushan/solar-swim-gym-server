import nodemailer from 'nodemailer';

// Configure Zoho SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in', // Changed from poppro.zoho.in (POP3) to smtp.zoho.in (SMTP)
  port: 465, // SSL port for SMTP
  secure: true, // Use SSL/TLS
  auth: {
    user: 'basudevb@mindfiresolutions.com',
    pass: '#Kks6747'
  }
});

/**
 * Send activation email to user
 */
export const sendActivationEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    const activationLink = `http://localhost:3000/api/v1/auth/activation/validate/${token}`;
    
    const mailOptions = {
      from: '"Solar Swim Gym" <basudevb@mindfiresolutions.com>',
      to: email,
      subject: 'Activate Your Solar Swim Gym Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Solar Swim Gym!</h2>
          <p>Thank you for registering with us. Please click the button below to activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Activate Account
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #7f8c8d; word-break: break-all;">${activationLink}</p>
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send general notification email
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: '"Solar Swim Gym" <basudevb@mindfiresolutions.com>',
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send invoice email
 */
export const sendInvoiceEmail = async (
  email: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: '"Solar Swim Gym" <basudevb@mindfiresolutions.com>',
      to: email,
      subject: `Invoice ${invoiceNumber} - Solar Swim Gym`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">New Invoice</h2>
          <p>You have received a new invoice from Solar Swim Gym.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          <p>Please log in to your account to view and pay this invoice.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invoice email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    return false;
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server verification failed:', error);
    return false;
  }
};
