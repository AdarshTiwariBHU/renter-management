import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import PasswordResetOtp from '@/models/PasswordResetOtp';
import AuditLog from '@/models/AuditLog';
import { sendOtpEmail } from '@/lib/email';

const PRIMARY_ADMIN_EMAIL = 'adarshcsbhu@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your email, username, or login ID.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    await connectToDatabase();

    // Look for matching user in database
    let user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
        { loginId: cleanIdentifier },
      ],
    });

    // If not found, check if it was 'admin' or matches primary email
    if (!user && (cleanIdentifier === 'admin' || cleanIdentifier === PRIMARY_ADMIN_EMAIL)) {
      user = await User.findOne({ role: { $in: ['ADMIN', 'admin'] } });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found matching this identifier.' },
        { status: 404 }
      );
    }

    // Check account status
    if (user.status === 'VACATED' || user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'This account has been deactivated or rejected.' },
        { status: 403 }
      );
    }

    // The user explicitly specified: "otp send to the main id adarshcsbhu@gmail.com"
    // For admin or when identifier is admin, we send to adarshcsbhu@gmail.com
    const targetEmail =
      user.role === 'ADMIN' || user.role === 'admin' || cleanIdentifier.includes('admin')
        ? PRIMARY_ADMIN_EMAIL
        : user.email || PRIMARY_ADMIN_EMAIL;

    // Generate random 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate prior unused OTPs for this email
    await PasswordResetOtp.deleteMany({ email: user.email.toLowerCase() });

    // Save new OTP record
    await PasswordResetOtp.create({
      email: user.email.toLowerCase(),
      targetEmail: targetEmail.toLowerCase(),
      otp,
      userId: user._id,
      expiresAt,
      verified: false,
    });

    // Send the email via Nodemailer
    const emailResult = await sendOtpEmail({
      toEmail: targetEmail,
      otp,
      username: user.username || user.loginId,
      recipientName: user.name || 'Administrator',
    });

    // Also send to user's registered email if different from primary admin email
    if (user.email && user.email.toLowerCase() !== targetEmail.toLowerCase() && user.email.includes('@')) {
      sendOtpEmail({
        toEmail: user.email,
        otp,
        username: user.username,
        recipientName: user.name,
      }).catch((e) => console.error('Secondary email dispatch error:', e));
    }

    // Audit log
    await AuditLog.create({
      action: 'PASSWORD_RESET_OTP_REQUESTED',
      performedBy: user.username || 'System',
      entityType: 'Auth',
      entityId: user._id.toString(),
      details: { targetEmail, ip: request.headers.get('x-forwarded-for') || 'local' },
    });

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been securely sent to ${targetEmail}.`,
      targetEmail,
    });
  } catch (error: unknown) {
    console.error('Send OTP error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to send OTP';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
