import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isAdminRole } from '@/lib/auth';

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
    const { rejectionReason } = await request.json();

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required when rejecting an application.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Registration request not found' }, { status: 404 });
    }

    const cleanReason = rejectionReason.trim();

    renter.status = 'REJECTED';
    renter.rejectionReason = cleanReason;
    await renter.save();

    let user = null;
    if (renter.userId) {
      user = await User.findById(renter.userId);
    } else {
      user = await User.findOne({ renterId: renter._id });
    }

    if (user) {
      user.status = 'REJECTED';
      user.rejectionReason = cleanReason;
      user.loginEnabled = false;
      await user.save();
    }

    await AuditLog.create({
      action: 'RENTER_REQUEST_REJECTED',
      performedBy: session.auth.username || 'Admin',
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        renterName: renter.fullName,
        reason: cleanReason,
      },
    });

    return NextResponse.json({
      success: true,
      data: renter,
      message: `Registration for ${renter.fullName} has been rejected.`,
    });
  } catch (error: unknown) {
    console.error('Reject renter request error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reject request';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
