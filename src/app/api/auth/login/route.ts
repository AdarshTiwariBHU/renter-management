import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.email || body.username || body.loginId;
    const { password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide email/username and password' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
        { loginId: normalizedIdentifier },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Account Status & Login Permissions Verification
    if (user.status === 'PENDING_VERIFICATION') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account is waiting for admin verification.',
          status: 'PENDING_VERIFICATION',
        },
        { status: 403 }
      );
    }

    if (user.status === 'REJECTED') {
      const reason = user.rejectionReason
        ? `Reason: ${user.rejectionReason}`
        : 'Please contact the administrator.';
      return NextResponse.json(
        {
          success: false,
          error: `Your registration was rejected. ${reason}`,
          status: 'REJECTED',
        },
        { status: 403 }
      );
    }

    if (user.status === 'VACATED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your renter account has been deactivated because your tenancy has ended.',
          status: 'VACATED',
        },
        { status: 403 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account has been suspended. Please contact admin.',
          status: 'SUSPENDED',
        },
        { status: 403 }
      );
    }

    if (user.loginEnabled === false) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your login access is currently disabled. Please contact admin.',
          status: 'DISABLED',
        },
        { status: 403 }
      );
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const normalizedRole = user.role ? String(user.role).toUpperCase() : 'ADMIN';
    const isRenter = normalizedRole === 'RENTER';

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      loginId: user.loginId,
      name: user.name,
      role: normalizedRole,
      renterId: user.renterId ? user.renterId.toString() : undefined,
      tokenVersion: user.tokenVersion || 0,
    });

    await AuditLog.create({
      action: 'LOGIN',
      performedBy: user.username || user.name,
      entityType: 'Auth',
      entityId: user._id.toString(),
      details: { role: normalizedRole, ip: request.headers.get('x-forwarded-for') || 'local' },
    });

    const redirectUrl = isRenter ? '/renter/dashboard' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        loginId: user.loginId,
        name: user.name,
        role: normalizedRole,
        renterId: user.renterId,
        redirectUrl,
        mustChangePassword: user.mustChangePassword || false,
        token,
      },
      message: 'Logged in successfully',
    });

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
