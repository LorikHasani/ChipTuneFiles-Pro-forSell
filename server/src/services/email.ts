import nodemailer from 'nodemailer';

// SMTP transporter configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  // Allow self-signed certs in development
  ...(process.env.NODE_ENV !== 'production' && {
    tls: { rejectUnauthorized: false },
  }),
});

// Sender defaults
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'ChipTuneFiles Pro';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@chiptunefiles.com';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * Send a generic email.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html: wrapInTemplate(subject, html),
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send a job status notification email to the client.
 */
export async function sendJobNotification(
  to: string,
  clientName: string,
  referenceNumber: string,
  status: string,
  jobId: string,
  additionalMessage?: string
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending Review',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_INFO: 'Waiting for Information',
    COMPLETED: 'Completed',
    REVISION_REQUESTED: 'Revision Requested',
    REJECTED: 'Rejected',
  };

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_FOR_INFO: '#f97316',
    COMPLETED: '#22c55e',
    REVISION_REQUESTED: '#a855f7',
    REJECTED: '#ef4444',
  };

  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#6b7280';
  const jobUrl = `${APP_URL}/jobs/${jobId}`;

  const subject = `Job ${referenceNumber} - ${statusLabel}`;

  const html = `
    <p>Hello ${clientName || 'there'},</p>
    <p>Your tuning job <strong>${referenceNumber}</strong> has been updated.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 8px 16px; background-color: ${statusColor}; color: #ffffff; border-radius: 6px; font-weight: 600; font-size: 14px;">
          ${statusLabel}
        </td>
      </tr>
    </table>
    ${additionalMessage ? `<p>${additionalMessage}</p>` : ''}
    ${status === 'COMPLETED' ? '<p>Your modified file is now available for download.</p>' : ''}
    ${status === 'WAITING_FOR_INFO' ? '<p>We need additional information from you to continue processing your file. Please check your job details.</p>' : ''}
    <p style="margin-top: 24px;">
      <a href="${jobUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Job Details
      </a>
    </p>
  `;

  return sendEmail(to, subject, html);
}

/**
 * Send a credit purchase confirmation email.
 */
export async function sendCreditConfirmation(
  to: string,
  clientName: string,
  creditsAmount: number,
  bonusCredits: number,
  pricePaid: number,
  newBalance: number
): Promise<boolean> {
  const totalCredits = creditsAmount + bonusCredits;
  const subject = `Credit Purchase Confirmation - ${totalCredits} Credits`;

  const html = `
    <p>Hello ${clientName || 'there'},</p>
    <p>Your credit purchase has been confirmed. Here are the details:</p>
    <table cellpadding="8" cellspacing="0" border="0" style="margin: 20px 0; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="color: #6b7280; padding-right: 24px;">Credits Purchased</td>
        <td style="font-weight: 600;">${creditsAmount}</td>
      </tr>
      ${bonusCredits > 0 ? `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="color: #6b7280; padding-right: 24px;">Bonus Credits</td>
        <td style="font-weight: 600; color: #22c55e;">+${bonusCredits}</td>
      </tr>
      ` : ''}
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="color: #6b7280; padding-right: 24px;">Total Credits Added</td>
        <td style="font-weight: 600;">${totalCredits}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="color: #6b7280; padding-right: 24px;">Amount Paid</td>
        <td style="font-weight: 600;">&euro;${pricePaid.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color: #6b7280; padding-right: 24px;">New Balance</td>
        <td style="font-weight: 700; color: #3b82f6; font-size: 18px;">${newBalance} Credits</td>
      </tr>
    </table>
    <p style="margin-top: 24px;">
      <a href="${APP_URL}/credits" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Your Credits
      </a>
    </p>
  `;

  return sendEmail(to, subject, html);
}

/**
 * Send a new message notification email.
 */
export async function sendMessageNotification(
  to: string,
  clientName: string,
  referenceNumber: string,
  senderName: string,
  messagePreview: string,
  jobId: string
): Promise<boolean> {
  const jobUrl = `${APP_URL}/jobs/${jobId}`;
  const subject = `New Message on Job ${referenceNumber}`;

  const html = `
    <p>Hello ${clientName || 'there'},</p>
    <p>You have a new message on job <strong>${referenceNumber}</strong> from <strong>${senderName}</strong>:</p>
    <div style="margin: 20px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; color: #374151; font-style: italic;">"${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}"</p>
    </div>
    <p style="margin-top: 24px;">
      <a href="${jobUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Conversation
      </a>
    </p>
  `;

  return sendEmail(to, subject, html);
}

/**
 * Send a welcome email to new users.
 */
export async function sendWelcomeEmail(
  to: string,
  clientName: string
): Promise<boolean> {
  const subject = `Welcome to ${FROM_NAME}!`;

  const html = `
    <p>Hello ${clientName || 'there'},</p>
    <p>Welcome to <strong>${FROM_NAME}</strong>! Your account has been created successfully.</p>
    <p>Here is what you can do:</p>
    <ul style="color: #374151; line-height: 1.8;">
      <li>Upload your ECU/TCU files for professional tuning</li>
      <li>Choose from a wide range of tuning services</li>
      <li>Track your jobs in real-time</li>
      <li>Communicate directly with our tuning engineers</li>
    </ul>
    <p>To get started, purchase some credits and submit your first tuning job.</p>
    <p style="margin-top: 24px;">
      <a href="${APP_URL}/upload" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Submit Your First Job
      </a>
    </p>
  `;

  return sendEmail(to, subject, html);
}

/**
 * Wraps email content in a styled HTML template.
 */
function wrapInTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">
                ${FROM_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #374151; font-size: 15px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Verify SMTP connection on startup.
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.warn('SMTP connection failed - emails will not be sent:', error);
    return false;
  }
}

export default {
  sendEmail,
  sendJobNotification,
  sendCreditConfirmation,
  sendMessageNotification,
  sendWelcomeEmail,
  verifyEmailConnection,
};
