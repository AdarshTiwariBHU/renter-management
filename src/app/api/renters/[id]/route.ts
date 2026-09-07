import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import Room from '@/models/Room';
import Meter from '@/models/Meter';
import MeterReading from '@/models/MeterReading';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    const renter = await Renter.findById(id).populate('roomId');
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    const [meters, readings, bills, payments, transactions, auditLogs] = await Promise.all([
      Meter.find({ renterId: id }),
      MeterReading.find({ renterId: id, status: 'APPROVED' }).sort({ billingMonth: -1 }),
      Bill.find({ renterId: id }).sort({ billingMonth: -1 }),
      Payment.find({ renterId: id }).sort({ paymentDate: -1 }),
      Transaction.find({ renterId: id }).sort({ date: -1 }),
      AuditLog.find({ entityId: id }).sort({ createdAt: -1 }),
    ]);

    // Calculate total electricity units and cost across history
    const totalUnits = readings.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
    const totalElectricityCost = readings.reduce((sum, r) => sum + (r.electricityAmount || 0), 0);

    // Calculate outstanding balance from latest bills
    const totalOutstanding = bills.reduce((sum, b) => sum + (b.balance || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        renter,
        meters,
        readings,
        bills,
        payments,
        transactions,
        auditLogs,
        summary: {
          totalUnits,
          totalElectricityCost,
          totalOutstanding,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Renter profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renter profile' }, { status: 500 });
  }
}

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
    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    const previousRent = renter.monthlyRent;
    const previousRoomId = renter.roomId ? renter.roomId.toString() : '';

    // If room is changing
    if (body.roomId && body.roomId !== previousRoomId) {
      const newRoom = await Room.findById(body.roomId);
      if (!newRoom) {
        return NextResponse.json({ success: false, error: 'Target room not found' }, { status: 404 });
      }
      if (newRoom.status === 'OCCUPIED' && newRoom.currentRenterId?.toString() !== id) {
        return NextResponse.json(
          { success: false, error: `Room ${newRoom.roomNumber} is already occupied` },
          { status: 400 }
        );
      }

      // Vacate previous room if one existed
      if (previousRoomId) {
        await Room.findByIdAndUpdate(previousRoomId, {
          status: 'VACANT',
          currentRenterId: null,
        });
      }

      // Occupy new room
      newRoom.status = 'OCCUPIED';
      newRoom.currentRenterId = renter._id;
      await newRoom.save();

      renter.roomId = newRoom._id;
      renter.roomNumber = newRoom.roomNumber;
    }

    // Update allowable fields
    if (body.fullName) renter.fullName = body.fullName.trim();
    if (body.photoUrl !== undefined) renter.photoUrl = body.photoUrl;
    if (body.fatherName) renter.fatherName = body.fatherName.trim();
    if (body.motherName !== undefined) renter.motherName = body.motherName.trim();
    if (body.mobile) renter.mobile = body.mobile.trim();
    if (body.alternateMobile !== undefined) renter.alternateMobile = body.alternateMobile.trim();
    if (body.email !== undefined) renter.email = body.email.trim();
    if (body.permanentAddress) renter.permanentAddress = body.permanentAddress.trim();
    if (body.currentAddress !== undefined) renter.currentAddress = body.currentAddress.trim();
    if (body.aadhaarNumber) renter.aadhaarNumber = body.aadhaarNumber.trim();
    if (body.aadhaarFrontUrl !== undefined) renter.aadhaarFrontUrl = body.aadhaarFrontUrl;
    if (body.aadhaarBackUrl !== undefined) renter.aadhaarBackUrl = body.aadhaarBackUrl;
    if (body.otherDocumentUrl !== undefined) renter.otherDocumentUrl = body.otherDocumentUrl;
    if (body.monthlyRent !== undefined) renter.monthlyRent = Number(body.monthlyRent);
    if (body.securityDeposit !== undefined) renter.securityDeposit = Number(body.securityDeposit);
    if (body.rentDueDay !== undefined) renter.rentDueDay = Number(body.rentDueDay);

    await renter.save();

    // Audit log
    await AuditLog.create({
      action: 'RENTER_UPDATED',
      performedBy: auth.username,
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        rentChanged: previousRent !== renter.monthlyRent ? { from: previousRent, to: renter.monthlyRent } : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: renter,
      message: 'Renter updated successfully without altering historical bills',
    });
  } catch (error: unknown) {
    console.error('Renter PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update renter' }, { status: 500 });
  }
}
