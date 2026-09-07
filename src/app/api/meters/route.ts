import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Meter from '@/models/Meter';
import Renter from '@/models/Renter';
import Property from '@/models/Property';
import Room from '@/models/Room';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    // Ensure referenced schemas are registered for populate
    void Property;
    void Room;
    void Renter;

    const { searchParams } = new URL(request.url);
    const renterId = searchParams.get('renterId');
    const propertyId = searchParams.get('propertyId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const filter: Record<string, unknown> = {};
    if (renterId) {
      if (mongoose.Types.ObjectId.isValid(renterId)) {
        filter.renterId = new mongoose.Types.ObjectId(renterId);
      } else {
        filter.renterId = renterId;
      }
    }
    if (propertyId && propertyId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(propertyId)) {
        filter.propertyId = new mongoose.Types.ObjectId(propertyId);
      } else {
        filter.propertyId = propertyId;
      }
    }
    if (activeOnly) filter.isActive = true;

    const meters = await Meter.find(filter)
      .populate('propertyId', 'name type address city')
      .populate('renterId', 'fullName roomNumber status')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: meters });
  } catch (error: unknown) {
    console.error('Meters GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { renterId, meterName, startingReading, ratePerUnit } = body;

    if (!renterId || !meterName) {
      return NextResponse.json(
        { success: false, error: 'Renter and meter name are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const renter = await Renter.findById(renterId);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    const existing = await Meter.findOne({
      renterId,
      meterName: meterName.trim(),
      isActive: true,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Meter "${meterName}" already exists for this renter` },
        { status: 400 }
      );
    }

    const meter = await Meter.create({
      propertyId: renter.propertyId,
      renterId,
      roomId: renter.roomId,
      meterName: meterName.trim(),
      startingReading: Number(startingReading) || 0,
      currentReading: Number(startingReading) || 0,
      ratePerUnit: Number(ratePerUnit) || 10,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: meter,
      message: 'Meter added successfully',
    });
  } catch (error: unknown) {
    console.error('Meter POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add meter' }, { status: 500 });
  }
}
