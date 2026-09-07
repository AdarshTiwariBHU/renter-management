import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Property from '@/models/Property';
import Room from '@/models/Room';
import Renter from '@/models/Renter';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';
import { getAuthFromRequest, isAdminRole } from '@/lib/auth';
import { ensureDefaultProperty } from '@/lib/propertyMigration';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultProperty();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const single = searchParams.get('single') === 'true';

    // If caller specifically requested single/default property (e.g. system settings or receipt modal)
    if (single) {
      const defaultProp = (await Property.findOne({ status: 'ACTIVE' })) || (await Property.findOne());
      return NextResponse.json({ success: true, data: defaultProp });
    }

    const filter: Record<string, unknown> = {};
    if (activeOnly) {
      filter.status = 'ACTIVE';
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 }).lean();

    // Enrich each property with live room, renter, occupancy, and financial counts
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const enriched = await Promise.all(
      properties.map(async (prop) => {
        const propId = prop._id;

        const [
          totalRooms,
          occupiedRooms,
          vacantRooms,
          totalRenters,
          pendingAgg,
          paymentsAgg,
        ] = await Promise.all([
          Room.countDocuments({ propertyId: propId }),
          Room.countDocuments({ propertyId: propId, status: 'OCCUPIED' }),
          Room.countDocuments({ propertyId: propId, status: 'VACANT' }),
          Renter.countDocuments({ propertyId: propId, status: 'ACTIVE' }),
          Bill.aggregate([
            { $match: { propertyId: propId, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } },
          ]),
          Payment.aggregate([
            {
              $match: {
                propertyId: propId,
                paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        return {
          ...prop,
          roomsCount: totalRooms,
          occupiedRooms,
          vacantRooms,
          rentersCount: totalRenters,
          pendingAmount: pendingAgg[0]?.total || 0,
          paidThisMonth: paymentsAgg[0]?.total || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error('Property GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !isAdminRole(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type = 'Building',
      address = '',
      city = '',
      state = '',
      pinCode = '',
      photo = '',
      description = '',
      status = 'ACTIVE',
      phone = '+91 98765 43210',
      email = 'adarshcsbhu@gmail.com',
      defaultRentDueDay = 5,
      defaultElectricityRate = 10,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Property name is required' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Property.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A property with name "${name.trim()}" already exists` },
        { status: 400 }
      );
    }

    const property = await Property.create({
      adminId: auth.userId,
      name: name.trim(),
      type,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      photo: photo || '',
      description: description.trim(),
      status,
      phone: phone.trim(),
      email: email.trim(),
      defaultRentDueDay: Number(defaultRentDueDay) || 5,
      defaultElectricityRate: Number(defaultElectricityRate) || 10,
      currency: 'INR',
    });

    return NextResponse.json({
      success: true,
      data: property,
      message: `Property "${property.name}" created successfully`,
    });
  } catch (error: unknown) {
    console.error('Property POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create property';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !isAdminRole(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    // If an ID is provided, update that specific property
    let prop = null;
    if (body._id || body.id) {
      prop = await Property.findById(body._id || body.id);
    } else {
      prop = await Property.findOne();
    }

    if (!prop) {
      prop = new Property({ ...body, adminId: auth.userId });
    } else {
      if (body.smtpPass === '' && prop?.smtpPass) {
        delete body.smtpPass;
      }
      Object.assign(prop, body);
    }

    await prop.save();

    return NextResponse.json({ success: true, data: prop, message: 'Settings saved successfully' });
  } catch (error: unknown) {
    console.error('Property PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update property details' }, { status: 500 });
  }
}
