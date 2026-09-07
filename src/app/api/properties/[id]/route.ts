import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Property from '@/models/Property';
import Room from '@/models/Room';
import Renter from '@/models/Renter';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';
import Meter from '@/models/Meter';
import MeterReading from '@/models/MeterReading';
import { getAuthFromRequest, isAdminRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    const property = await Property.findById(id).lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      totalRenters,
      pendingBillsAgg,
      monthPaymentsAgg,
      monthReadingsAgg,
      pendingReadingsCount,
      pendingRequestsCount,
    ] = await Promise.all([
      Room.countDocuments({ propertyId: id }),
      Room.countDocuments({ propertyId: id, status: 'OCCUPIED' }),
      Room.countDocuments({ propertyId: id, status: 'VACANT' }),
      Room.countDocuments({ propertyId: id, status: 'MAINTENANCE' }),
      Renter.countDocuments({ propertyId: id, status: 'ACTIVE' }),
      Bill.aggregate([
        { $match: { propertyId: property._id, balance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            propertyId: property._id,
            paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      MeterReading.aggregate([
        { $match: { propertyId: property._id, billingMonth: currentMonth } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$unitsConsumed' },
            totalAmount: { $sum: '$electricityAmount' },
          },
        },
      ]),
      MeterReading.countDocuments({ propertyId: id, status: 'PENDING_REVIEW' }),
      Renter.countDocuments({
        status: 'PENDING_VERIFICATION',
        $or: [{ propertyId: id }, { requestedPropertyId: id }],
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        stats: {
          totalRooms,
          occupiedRooms,
          vacantRooms,
          maintenanceRooms,
          occupancyRate,
          totalRenters,
          pendingAmount: pendingBillsAgg[0]?.total || 0,
          pendingBillsCount: pendingBillsAgg[0]?.count || 0,
          paidThisMonth: monthPaymentsAgg[0]?.total || 0,
          electricityCollection: monthReadingsAgg[0]?.totalAmount || 0,
          electricityUnits: monthReadingsAgg[0]?.totalUnits || 0,
          pendingReadingsCount,
          pendingRequestsCount,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Property GET ID error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch property details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !isAdminRole(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    await connectToDatabase();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (body.name && body.name.trim() !== property.name) {
      const existing = await Property.findOne({
        name: body.name.trim(),
        _id: { $ne: property._id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Another property already exists with name "${body.name.trim()}"` },
          { status: 400 }
        );
      }
      property.name = body.name.trim();
    }

    if (body.type !== undefined) property.type = body.type;
    if (body.address !== undefined) property.address = body.address.trim();
    if (body.city !== undefined) property.city = body.city.trim();
    if (body.state !== undefined) property.state = body.state.trim();
    if (body.pinCode !== undefined) property.pinCode = body.pinCode.trim();
    if (body.photo !== undefined) property.photo = body.photo;
    if (body.description !== undefined) property.description = body.description.trim();
    if (body.status !== undefined) property.status = body.status;
    if (body.phone !== undefined) property.phone = body.phone.trim();
    if (body.email !== undefined) property.email = body.email.trim();
    if (body.defaultRentDueDay !== undefined) property.defaultRentDueDay = Number(body.defaultRentDueDay);
    if (body.defaultElectricityRate !== undefined) property.defaultElectricityRate = Number(body.defaultElectricityRate);

    await property.save();

    return NextResponse.json({
      success: true,
      data: property,
      message: `Property "${property.name}" updated successfully`,
    });
  } catch (error: unknown) {
    console.error('Property PUT ID error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update property';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE toggles active/inactive status without deleting historical records
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !isAdminRole(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Toggle status
    const newStatus = property.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    property.status = newStatus;
    await property.save();

    return NextResponse.json({
      success: true,
      data: property,
      message: `Property "${property.name}" is now ${newStatus}. All historical data is preserved.`,
    });
  } catch (error: unknown) {
    console.error('Property DELETE/Deactivate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update property status' }, { status: 500 });
  }
}
