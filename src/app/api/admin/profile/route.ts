import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isAdminRole, signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobile: user.mobile || '',
        avatarUrl: user.avatarUrl || '',
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Admin profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, username, mobile, avatarUrl } = body;

    await connectToDatabase();
    const user = await User.findById(session.auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
    }

    // Validate email uniqueness if changing
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'This email is already in use by another account.' },
          { status: 400 }
        );
      }
      user.email = cleanEmail;
    }

    // Validate username uniqueness if changing
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = username.trim().toLowerCase();
      const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'This username is already in use by another account.' },
          { status: 400 }
        );
      }
      user.username = cleanUsername;
    }

    if (name && name.trim()) user.name = name.trim();
    if (mobile !== undefined) user.mobile = mobile.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    await user.save();

    // Create refreshed session token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      role: 'ADMIN',
      tokenVersion: user.tokenVersion || 0,
    });

    await AuditLog.create({
      action: 'ADMIN_PROFILE_UPDATED',
      performedBy: user.username || user.name,
      entityType: 'User',
      entityId: user._id.toString(),
      details: {
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully.',
      token,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobile: user.mobile || '',
        avatarUrl: user.avatarUrl || '',
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error('Admin profile PUT error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
