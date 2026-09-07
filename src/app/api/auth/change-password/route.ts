import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, comparePassword, hashPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Please provide both current and new password' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(auth.userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_CHANGED',
      performedBy: user.username,
      entityType: 'Auth',
      entityId: user._id.toString(),
      details: {},
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: unknown) {
    console.error('Password change error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
  }
}
