import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Room from '@/models/Room';
import Property from '@/models/Property';
import '@/models/Renter'; // Ensure model registered for populate
import { getAuthFromRequest, isAdminRole } from '@/lib/auth';
import { ensureDefaultProperty } from '@/lib/propertyMigration';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultProperty();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');

    const filter: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (propertyId && propertyId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(propertyId)) {
        filter.propertyId = new mongoose.Types.ObjectId(propertyId);
      }
    }

    const rooms = await Room.find(filter)
      .populate('propertyId', 'name type address city status')
      .populate('currentRenterId', 'fullName mobile photoUrl status')
      .sort({ floor: 1, roomNumber: 1 });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: unknown) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !isAdminRole(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { roomNumber, floor, roomType, monthlyRentDefault, building, propertyId } = body;

    if (!roomNumber || floor === undefined || !monthlyRentDefault) {
      return NextResponse.json(
        { success: false, error: 'Room number, floor, and monthly rent are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureDefaultProperty();

    // If propertyId not provided, assign default property
    if (!propertyId) {
      const defaultProp = await Property.findOne({ status: 'ACTIVE' });
      if (!defaultProp) {
        return NextResponse.json({ success: false, error: 'No active property found to add room to' }, { status: 400 });
      }
      propertyId = defaultProp._id.toString();
    }

    // Verify property exists and is ACTIVE
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Target property not found' }, { status: 404 });
    }

    if (property.status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, error: `Cannot create rooms under inactive property "${property.name}". Please activate it first.` },
        { status: 400 }
      );
    }

    // Check uniqueness within this property ONLY (Section 12.4: room number only needs to be unique within a property)
    const existing = await Room.findOne({
      propertyId: property._id,
      roomNumber: roomNumber.trim(),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Room "${roomNumber}" already exists in ${property.name}` },
        { status: 400 }
      );
    }

    const room = await Room.create({
      propertyId: property._id,
      property: property._id,
      roomNumber: roomNumber.trim(),
      floor: Number(floor),
      roomType: roomType || '1BHK',
      monthlyRentDefault: Number(monthlyRentDefault),
      building: building || property.name || 'Main Wing',
      status: 'VACANT',
    });

    return NextResponse.json({
      success: true,
      data: room,
      message: `Room ${room.roomNumber} created successfully in ${property.name}`,
    });
  } catch (error: unknown) {
    console.error('Room POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
