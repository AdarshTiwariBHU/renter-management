import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import Room from '@/models/Room';
import Meter from '@/models/Meter';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(
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
    const {
      leavingDate,
      finalMeterReadings = [],
      finalRentDue = 0,
      finalElectricityDue = 0,
      otherCharges = 0,
      securityDeposit = 0,
      deductions = 0,
      refundAmount = 0,
      settlementNotes = '',
    } = body;

    if (!leavingDate) {
      return NextResponse.json({ success: false, error: 'Leaving date is required' }, { status: 400 });
    }

    await connectToDatabase();
    const renter = await Renter.findById(id);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    if (renter.status === 'VACATED') {
      return NextResponse.json({ success: false, error: 'Renter is already vacated' }, { status: 400 });
    }

    // Save final settlement details on Renter
    renter.status = 'VACATED';
    renter.vacatedDetails = {
      leavingDate: new Date(leavingDate),
      finalMeterReadings,
      finalRentDue: Number(finalRentDue),
      finalElectricityDue: Number(finalElectricityDue),
      otherCharges: Number(otherCharges),
      securityDeposit: Number(securityDeposit),
      deductions: Number(deductions),
      refundAmount: Number(refundAmount),
      settlementNotes,
      settledAt: new Date(),
    };
    await renter.save();

    // Invalidate renter User login access and mark status as VACATED (Requirements 27 & 28)
    await User.updateMany(
      { $or: [{ renterId: renter._id }, { _id: renter.userId }] },
      { $set: { status: 'VACATED', loginEnabled: false } }
    );

    // Release the Room
    if (renter.roomId) {
      await Room.findByIdAndUpdate(renter.roomId, {
        status: 'VACANT',
        currentRenterId: null,
      });
    }

    // Deactivate meters
    await Meter.updateMany({ renterId: renter._id }, { isActive: false });

    // Ledger entries for final settlement
    const settleDate = new Date(leavingDate);
    if (Number(deductions) > 0) {
      await Transaction.create({
        renterId: renter._id,
        date: settleDate,
        type: 'ADJUSTMENT',
        description: `Final Settlement Deduction: ${settlementNotes || 'Repairs / Outstanding bills'}`,
        debit: Number(deductions),
        credit: 0,
        balanceAfter: 0,
      });
    }

    if (Number(refundAmount) > 0) {
      await Transaction.create({
        renterId: renter._id,
        date: settleDate,
        type: 'DEPOSIT_REFUND',
        description: `Security Deposit Refund to Renter`,
        debit: 0,
        credit: Number(refundAmount),
        balanceAfter: 0,
      });
    }

    await AuditLog.create({
      action: 'RENTER_VACATED',
      performedBy: auth.username,
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        roomNumber: renter.roomNumber,
        refundAmount,
        deductions,
        leavingDate,
      },
    });

    return NextResponse.json({
      success: true,
      data: renter,
      message: 'Renter marked as vacated and room released successfully',
    });
  } catch (error: unknown) {
    console.error('Vacate POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to mark renter as vacated' }, { status: 500 });
  }
}
