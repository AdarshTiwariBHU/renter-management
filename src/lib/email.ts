import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/lib/db';
import Property from '@/models/Property';

interface SendOtpOptions {
  toEmail: string;
  otp: string;
  username?: string;
  recipientName?: string;
}

export async function sendOtpEmail({
  toEmail,
  otp,
  username,
  recipientName = 'KirayaPro User',
}: SendOtpOptions): Promise<{ success: boolean; method: 'smtp' | 'console'; error?: string }> {
  let smtpUser = process.env.SMTP_USER;
  let smtpPass = process.env.SMTP_PASS;
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = Number(process.env.SMTP_PORT) || 465;

  try {
    await connectToDatabase();
    const prop = await Property.findOne();
    if (prop) {
      if (prop.smtpUser) smtpUser = prop.smtpUser;
      if (prop.smtpPass) smtpPass = prop.smtpPass;
      if (prop.smtpHost) smtpHost = prop.smtpHost;
      if (prop.smtpPort) smtpPort = prop.smtpPort;
    }
  } catch (dbErr) {
    console.warn('[KirayaPro Email] Could not load property SMTP settings from DB:', dbErr);
  }

  const smtpFrom = process.env.SMTP_FROM || `"KirayaPro Support" <${smtpUser || 'no-reply@kirayapro.com'}>`;

  // Always log for debugging and verification in the server console ONLY
  console.log(`\n======================================================`);
  console.log(`[KirayaPro SECURE OTP DISPATCH]`);
  console.log(`To: ${toEmail}`);
  console.log(`User: ${username || 'N/A'}`);
  console.log(`6-Digit Verification OTP: [ ${otp} ]`);
  console.log(`Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  if (!smtpUser || !smtpPass) {
    console.log(`[KirayaPro Email] Note: SMTP credentials not yet configured in Settings. Logging OTP in server console.`);
    return { success: true, method: 'console' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #334155; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 30px; }
          .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
          .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace; }
          .warning { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
          .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KirayaPro</h1>
            <p>Smart Tenancy & Property Management</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Reset Verification</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              Hello <strong>${recipientName}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              A request was received to reset the password for your KirayaPro account${username ? ` (<strong>${username}</strong>)` : ''}.
              Please use the verification code below to complete your password reset:
            </p>
            <div class="otp-box">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 5px;">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 5px;">Valid for 10 minutes</div>
            </div>
            <div class="warning">
              If you did not request this password reset, please ignore this email or contact your property administrator immediately. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} KirayaPro Management System. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `[KirayaPro] Password Reset Verification Code: ${otp}`,
      text: `Your KirayaPro password reset verification code is: ${otp}. It is valid for 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[KirayaPro Email] Successfully dispatched OTP email to: ${toEmail}`);
    return { success: true, method: 'smtp' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[KirayaPro Email Error] Failed to send email via SMTP:`, errorMsg);
    return { success: true, method: 'console', error: errorMsg };
  }
}

export async function sendTestEmail(targetEmail: string): Promise<{ success: boolean; message: string }> {
  let smtpUser = process.env.SMTP_USER;
  let smtpPass = process.env.SMTP_PASS;
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = Number(process.env.SMTP_PORT) || 465;

  try {
    await connectToDatabase();
    const prop = await Property.findOne();
    if (prop) {
      if (prop.smtpUser) smtpUser = prop.smtpUser;
      if (prop.smtpPass) smtpPass = prop.smtpPass;
      if (prop.smtpHost) smtpHost = prop.smtpHost;
      if (prop.smtpPort) smtpPort = prop.smtpPort;
    }
  } catch (dbErr) {
    console.warn('[KirayaPro Email] Could not load property SMTP settings from DB:', dbErr);
  }

  if (!smtpUser || !smtpPass) {
    return {
      success: false,
      message: 'SMTP credentials (Sender Email and App Password) are not configured yet.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"KirayaPro System" <${smtpUser}>`,
      to: targetEmail,
      subject: `[KirayaPro] Test Email - SMTP Connected Successfully!`,
      text: `Congratulations! Your KirayaPro email dispatcher is fully configured and connected to Gmail.\nAll password reset OTPs and system notifications will be delivered to ${targetEmail}.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#2563eb;margin-top:0;">KirayaPro SMTP Verified!</h2>
          <p>Congratulations! Your Gmail / SMTP integration is successfully connected and operational.</p>
          <p>Recipient: <strong>${targetEmail}</strong></p>
          <p style="color:#64748b;font-size:12px;">Timestamp: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
    });

    return {
      success: true,
      message: `Test email sent successfully to ${targetEmail}! Please check your Gmail inbox.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to dispatch test email: ${errorMsg}`,
    };
  }
}
