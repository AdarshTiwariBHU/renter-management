import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import PasswordResetOtp from '@/models/PasswordResetOtp';
import AuditLog from '@/models/AuditLog';
import { hashPassword, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetToken, newPassword, logoutFromAllDevices } = body;

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Reset token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the verified OTP record by resetToken
    const record = await PasswordResetOtp.findOne({
      resetToken,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please start over.' },
        { status: 400 }
      );
    }

    // Find the user
    let user = null;
    if (record.userId) {
      user = await User.findById(record.userId);
    }
    if (!user && record.email) {
      user = await User.findOne({ email: record.email });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;

    // Handle logout from all devices option (default: true for maximum security)
    const shouldLogoutAll = logoutFromAllDevices !== false;
    if (shouldLogoutAll) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    // Delete used OTP record
    await PasswordResetOtp.deleteOne({ _id: record._id });

    // Audit log
    await AuditLog.create({
      action: 'PASSWORD_RESET_COMPLETED',
      performedBy: user.username || user.name,
      entityType: 'Auth',
      entityId: user._id.toString(),
      details: {
        email: user.email,
        logoutFromAllDevices: shouldLogoutAll,
        tokenVersion: user.tokenVersion,
        ip: request.headers.get('x-forwarded-for') || 'local',
      },
    });

    const response = NextResponse.json({
      success: true,
      logoutFromAllDevices: shouldLogoutAll,
      message: shouldLogoutAll
        ? 'Password updated successfully! All active sessions across all devices have been revoked.'
        : 'Password updated successfully! Other active sessions remain logged in.',
    });

    // Clear any token on this browser to guarantee fresh login
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
