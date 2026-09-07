import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import PasswordResetOtp from '@/models/PasswordResetOtp';
import AuditLog from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetEmail, otp } = body;

    if (!targetEmail || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit OTP are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    await connectToDatabase();

    // Look for matching valid OTP
    const record = await PasswordResetOtp.findOne({
      $or: [{ targetEmail: cleanEmail }, { email: cleanEmail }],
      otp: cleanOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Generate secure single-use reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    record.verified = true;
    record.resetToken = resetToken;
    await record.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET_OTP_VERIFIED',
      performedBy: cleanEmail,
      entityType: 'Auth',
      entityId: record.userId ? record.userId.toString() : undefined,
      details: { targetEmail: cleanEmail },
    });

    return NextResponse.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully. You may now set your new password.',
    });
  } catch (error: unknown) {
    console.error('Verify OTP error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to verify OTP';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
