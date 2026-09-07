import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import { verifySessionUser, isAdminRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const filter: Record<string, unknown> = {
      status: 'PENDING_VERIFICATION',
    };

    if (propertyId && propertyId !== 'ALL') {
      filter.$or = [
        { propertyId },
        { requestedPropertyId: propertyId },
      ];
    }

    const pendingRenters = await Renter.find(filter)
      .populate('userId', 'username loginId email status createdAt')
      .populate('requestedPropertyId', 'name type address city')
      .populate('propertyId', 'name type address city')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: pendingRenters,
      count: pendingRenters.length,
    });
  } catch (error: unknown) {
    console.error('Renter requests GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch registration requests' }, { status: 500 });
  }
}
