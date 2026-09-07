import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isAdminRole, hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    await connectToDatabase();

    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    let user = await User.findOne({ renterId: renter._id });
    if (!user && renter.userId) {
      user = await User.findById(renter.userId);
    }

    // Auto-create user account if missing for legacy / seeded renters
    if (!user) {
      const roomPart = renter.roomNumber ? renter.roomNumber.toLowerCase() : '';
      const generatedLoginId = (
        renter.fullName.split(' ')[0].toLowerCase() + roomPart
      ).replace(/[^a-z0-9]/g, '') || `renter${renter.mobile.slice(-4)}`;

      // Ensure unique loginId
      let finalLoginId = generatedLoginId;
      let counter = 1;
      while (await User.findOne({ loginId: finalLoginId })) {
        finalLoginId = `${generatedLoginId}${counter}`;
        counter++;
      }

      const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
      const passwordHash = await hashPassword(tempPassword);

      user = await User.create({
        email: renter.email || `${finalLoginId}@renter.local`,
        username: finalLoginId,
        loginId: finalLoginId,
        passwordHash,
        name: renter.fullName,
        role: 'RENTER',
        renterId: renter._id,
        status: renter.status === 'VACATED' ? 'VACATED' : 'ACTIVE',
        loginEnabled: renter.status !== 'VACATED',
        mustChangePassword: true,
        createdBy: session.auth.username || 'admin',
      });

      renter.userId = user._id;
      await renter.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        loginId: user.loginId || user.username,
        email: user.email,
        status: user.status,
        verificationStatus: renter.status === 'ACTIVE' ? 'VERIFIED' : renter.status,
        loginEnabled: user.loginEnabled,
        lastLoginAt: user.lastLoginAt || null,
        mustChangePassword: user.mustChangePassword || false,
      },
    });
  } catch (error: unknown) {
    console.error('Renter account GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch account info' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, newPassword } = body;

    await connectToDatabase();
    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    let user = await User.findOne({ renterId: renter._id });
    if (!user && renter.userId) {
      user = await User.findById(renter.userId);
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found for this renter' }, { status: 404 });
    }

    // Action 1: Toggle Login Enabled / Disabled
    if (action === 'toggle-login') {
      // Cannot enable if renter is vacated
      if (!user.loginEnabled && renter.status === 'VACATED') {
        return NextResponse.json(
          { success: false, error: 'Cannot enable login for a vacated tenant.' },
          { status: 400 }
        );
      }

      user.loginEnabled = !user.loginEnabled;
      await user.save();

      await AuditLog.create({
        action: user.loginEnabled ? 'RENTER_LOGIN_ENABLED' : 'RENTER_LOGIN_DISABLED',
        performedBy: session.auth.username || 'Admin',
        entityType: 'User',
        entityId: user._id.toString(),
        details: { renterName: renter.fullName, loginId: user.loginId, loginEnabled: user.loginEnabled },
      });

      return NextResponse.json({
        success: true,
        data: { loginEnabled: user.loginEnabled },
        message: user.loginEnabled
          ? `Login access enabled for ${user.loginId}`
          : `Login access disabled for ${user.loginId}`,
      });
    }

    // Action 2: Reset Password
    if (action === 'reset-password') {
      const generatedTempPassword =
        newPassword && newPassword.trim().length >= 6
          ? newPassword.trim()
          : `Temp@${crypto.randomInt(100000, 999999)}`;

      const passwordHash = await hashPassword(generatedTempPassword);
      user.passwordHash = passwordHash;
      user.mustChangePassword = true;
      await user.save();

      await AuditLog.create({
        action: 'RENTER_PASSWORD_RESET',
        performedBy: session.auth.username || 'Admin',
        entityType: 'User',
        entityId: user._id.toString(),
        details: { renterName: renter.fullName, loginId: user.loginId },
      });

      return NextResponse.json({
        success: true,
        data: {
          loginId: user.loginId || user.username,
          temporaryPassword: generatedTempPassword,
        },
        message: `Password reset successfully. Please share this temporary password with ${renter.fullName}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Renter account POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
