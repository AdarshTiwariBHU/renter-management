import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(auth.userId).select('-passwordHash');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'VACATED' || user.loginEnabled === false) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Your account is deactivated.',
          isDeactivated: true,
        },
        { status: 403 }
      );
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
    }

    // Session Revocation Check (Logged out from all devices)
    const currentTokenVersion = user.tokenVersion || 0;
    const tokenVersionInAuth = auth.tokenVersion || 0;
    if (tokenVersionInAuth < currentTokenVersion) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Session has expired or was revoked. You have been logged out from all devices.',
          isRevoked: true,
        },
        { status: 401 }
      );
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
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error('Auth check error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify session' }, { status: 500 });
  }
}
