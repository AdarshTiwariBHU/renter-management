import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import Room from '@/models/Room';
import Meter from '@/models/Meter';
import Bill from '@/models/Bill';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isAdminRole } from '@/lib/auth';
import { calculateBill } from '@/lib/calculations';

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
    const {
      roomId,
      monthlyRent,
      securityDeposit = 0,
      rentDueDay = 5,
      meters = [],
    } = body;

    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room selection is required to approve renter' }, { status: 400 });
    }

    await connectToDatabase();

    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Registration request not found' }, { status: 404 });
    }

    if (renter.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json(
        { success: false, error: `This request is already in status: ${renter.status}` },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Selected room not found' }, { status: 404 });
    }

    if (room.status === 'OCCUPIED' && room.currentRenterId && room.currentRenterId.toString() !== renter._id.toString()) {
      return NextResponse.json({ success: false, error: `Room ${room.roomNumber} is already occupied` }, { status: 400 });
    }

    const rentAmount = Number(monthlyRent) || room.monthlyRentDefault || 5000;
    const depositAmount = Number(securityDeposit) || 0;
    const dueDay = Number(rentDueDay) || 5;

    // Determine property ID
    const assignedPropertyId = room.propertyId || renter.propertyId;

    // 1. Update Renter record to ACTIVE
    renter.propertyId = assignedPropertyId;
    renter.roomId = room._id;
    renter.roomNumber = room.roomNumber;
    renter.monthlyRent = rentAmount;
    renter.securityDeposit = depositAmount;
    renter.rentDueDay = dueDay;
    renter.joiningDate = new Date();
    renter.status = 'ACTIVE';
    await renter.save();

    // 2. Update Room status
    room.status = 'OCCUPIED';
    room.currentRenterId = renter._id;
    await room.save();

    // 3. Create Meters
    const meterList = meters.length > 0 ? meters : [{ meterName: 'Room Meter', startingReading: 0, ratePerUnit: 10 }];
    for (const m of meterList) {
      await Meter.create({
        propertyId: assignedPropertyId,
        renterId: renter._id,
        roomId: room._id,
        meterName: m.meterName || 'Room Meter',
        startingReading: Number(m.startingReading) || 0,
        currentReading: Number(m.startingReading) || 0,
        ratePerUnit: Number(m.ratePerUnit) || 10,
        isActive: true,
      });
    }

    // 4. Update linked User account to ACTIVE and enable login
    let user = null;
    if (renter.userId) {
      user = await User.findById(renter.userId);
    } else {
      user = await User.findOne({ renterId: renter._id });
    }

    if (user) {
      user.status = 'ACTIVE';
      user.loginEnabled = true;
      user.renterId = renter._id;
      await user.save();
    }

    // 5. Initial Security Deposit Transaction if deposit > 0
    if (depositAmount > 0) {
      await Transaction.create({
        propertyId: assignedPropertyId,
        renterId: renter._id,
        date: renter.joiningDate,
        type: 'SECURITY_DEPOSIT',
        description: `Security Deposit Received - Room ${room.roomNumber}`,
        debit: 0,
        credit: depositAmount,
        balanceAfter: 0,
        paymentMethod: 'CASH',
      });
    }

    // 6. Generate first month's bill
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

    const billCalc = calculateBill(rentAmount, 0, 0, 0, 0, dueDate);
    const bill = await Bill.create({
      propertyId: assignedPropertyId,
      renterId: renter._id,
      roomId: room._id,
      roomNumber: room.roomNumber,
      billingMonth,
      rentAmount,
      electricityAmount: 0,
      meterBreakdown: [],
      otherCharges: 0,
      previousDue: 0,
      totalPayable: billCalc.totalPayable,
      paidAmount: 0,
      balance: billCalc.balance,
      status: billCalc.status,
      dueDate,
    });

    await Transaction.create({
      propertyId: assignedPropertyId,
      renterId: renter._id,
      date: now,
      type: 'DEBIT_BILL',
      description: `${billingMonth} Rent Bill Generated`,
      debit: rentAmount,
      credit: 0,
      balanceAfter: rentAmount,
      billId: bill._id,
    });

    await AuditLog.create({
      action: 'RENTER_REQUEST_APPROVED',
      performedBy: session.auth.username || 'Admin',
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        renterName: renter.fullName,
        roomNumber: room.roomNumber,
        rentAmount,
        loginId: user?.loginId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        renter,
        user: user ? { loginId: user.loginId, status: user.status, loginEnabled: user.loginEnabled } : null,
        room,
        bill,
      },
      message: `Renter ${renter.fullName} approved and activated in Room ${room.roomNumber}!`,
    });
  } catch (error: unknown) {
    console.error('Approve renter request error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to approve request';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
