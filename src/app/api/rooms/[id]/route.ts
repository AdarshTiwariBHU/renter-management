import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Room from '@/models/Room';
import { getAuthFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    await connectToDatabase();
    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    if (body.roomNumber && body.roomNumber !== room.roomNumber) {
      const existing = await Room.findOne({
        propertyId: room.propertyId,
        roomNumber: body.roomNumber.trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Room ${body.roomNumber} already exists in this property` },
          { status: 400 }
        );
      }
    }

    // Don't allow changing to VACANT if currently occupied with an active renter
    if (body.status === 'VACANT' && room.currentRenterId) {
      return NextResponse.json(
        { success: false, error: 'Cannot mark room as vacant while an active renter is assigned' },
        { status: 400 }
      );
    }

    Object.assign(room, body);
    await room.save();

    return NextResponse.json({ success: true, data: room, message: 'Room updated successfully' });
  } catch (error: unknown) {
    console.error('Room PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    if (room.status === 'OCCUPIED' || room.currentRenterId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an occupied room. Vacate renter first.' },
        { status: 400 }
      );
    }

    await Room.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: unknown) {
    console.error('Room DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete room' }, { status: 500 });
  }
}
