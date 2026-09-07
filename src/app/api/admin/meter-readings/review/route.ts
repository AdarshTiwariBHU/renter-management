import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import MeterReading from '@/models/MeterReading';
import Meter from '@/models/Meter';
import Renter from '@/models/Renter';
import Bill from '@/models/Bill';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isAdminRole } from '@/lib/auth';
import { calculateBill } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();

    const pendingReadings = await MeterReading.find({
      status: 'PENDING_REVIEW',
    })
      .populate('renterId', 'fullName roomNumber mobile')
      .populate('meterId', 'meterName ratePerUnit')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: pendingReadings,
      count: pendingReadings.length,
    });
  } catch (error: unknown) {
    console.error('Pending meter readings GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pending meter readings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { readingId, action, rejectionReason } = body;

    if (!readingId || !action) {
      return NextResponse.json(
        { success: false, error: 'Reading ID and action (approve/reject) are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const reading = await MeterReading.findById(readingId);
    if (!reading) {
      return NextResponse.json({ success: false, error: 'Meter reading not found' }, { status: 404 });
    }

    if (reading.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { success: false, error: `Reading is already in status: ${reading.status}` },
        { status: 400 }
      );
    }

    const [renter, meter] = await Promise.all([
      Renter.findById(reading.renterId),
      Meter.findById(reading.meterId),
    ]);

    if (!renter || !meter) {
      return NextResponse.json({ success: false, error: 'Linked renter or meter not found' }, { status: 404 });
    }

    // Handle Reject
    if (action === 'reject') {
      const reason = (rejectionReason || '').trim();
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required when rejecting a reading.' },
          { status: 400 }
        );
      }

      reading.status = 'REJECTED';
      reading.rejectionReason = reason;
      await reading.save();

      // Ensure bill has only approved readings
      const allApprovedMonthReadings = await MeterReading.find({
        renterId: renter._id,
        billingMonth: reading.billingMonth,
        status: 'APPROVED',
      });

      const totalElectricityAmount = allApprovedMonthReadings.reduce(
        (sum, r) => sum + (r.electricityAmount || 0),
        0
      );

      const meterBreakdown = allApprovedMonthReadings.map((r) => ({
        meterId: r.meterId,
        meterName: r.meterName,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsConsumed: r.unitsConsumed,
        ratePerUnit: r.ratePerUnit,
        amount: r.electricityAmount,
      }));

      const bill = await Bill.findOne({
        renterId: renter._id,
        billingMonth: reading.billingMonth,
      });

      if (bill) {
        bill.electricityAmount = totalElectricityAmount;
        bill.meterBreakdown = meterBreakdown;
        const billCalc = calculateBill(
          bill.rentAmount,
          bill.electricityAmount,
          bill.otherCharges,
          bill.previousDue,
          bill.paidAmount,
          bill.dueDate
        );
        bill.totalPayable = billCalc.totalPayable;
        bill.balance = billCalc.balance;
        bill.status = billCalc.status;
        await bill.save();
      }

      await AuditLog.create({
        action: 'METER_READING_REJECTED',
        performedBy: session.auth.username || 'Admin',
        entityType: 'MeterReading',
        entityId: reading._id.toString(),
        details: {
          renterName: renter.fullName,
          meterName: meter.meterName,
          billingMonth: reading.billingMonth,
          reason,
        },
      });

      return NextResponse.json({
        success: true,
        data: reading,
        message: 'Meter reading rejected with reason provided to renter.',
      });
    }

    // Handle Approve (Requirement 14: Use existing calculation system)
    if (action === 'approve') {
      reading.status = 'APPROVED';
      await reading.save();

      // Update meter current reading
      meter.currentReading = reading.currentReading;
      await meter.save();

      // Synchronize with monthly bill
      const allApprovedMonthReadings = await MeterReading.find({
        renterId: renter._id,
        billingMonth: reading.billingMonth,
        status: 'APPROVED',
      });

      const totalElectricityAmount = allApprovedMonthReadings.reduce(
        (sum, r) => sum + (r.electricityAmount || 0),
        0
      );

      const meterBreakdown = allApprovedMonthReadings.map((r) => ({
        meterId: r.meterId,
        meterName: r.meterName,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsConsumed: r.unitsConsumed,
        ratePerUnit: r.ratePerUnit,
        amount: r.electricityAmount,
      }));

      let bill = await Bill.findOne({ renterId: renter._id, billingMonth: reading.billingMonth });
      if (bill) {
        bill.electricityAmount = totalElectricityAmount;
        bill.meterBreakdown = meterBreakdown;
        const billCalc = calculateBill(
          bill.rentAmount,
          bill.electricityAmount,
          bill.otherCharges,
          bill.previousDue,
          bill.paidAmount,
          bill.dueDate
        );
        bill.totalPayable = billCalc.totalPayable;
        bill.balance = billCalc.balance;
        bill.status = billCalc.status;
        await bill.save();
      } else {
        const [year, month] = reading.billingMonth.split('-').map(Number);
        const dueDate = new Date(year, month - 1, renter.rentDueDay || 5);
        const billCalc = calculateBill(renter.monthlyRent, totalElectricityAmount, 0, 0, 0, dueDate);

        bill = await Bill.create({
          renterId: renter._id,
          roomId: renter.roomId,
          roomNumber: renter.roomNumber,
          billingMonth: reading.billingMonth,
          rentAmount: renter.monthlyRent,
          electricityAmount: totalElectricityAmount,
          meterBreakdown,
          otherCharges: 0,
          previousDue: 0,
          totalPayable: billCalc.totalPayable,
          paidAmount: 0,
          balance: billCalc.balance,
          status: billCalc.status,
          dueDate,
        });
      }

      await AuditLog.create({
        action: 'METER_READING_APPROVED',
        performedBy: session.auth.username || 'Admin',
        entityType: 'MeterReading',
        entityId: reading._id.toString(),
        details: {
          renterName: renter.fullName,
          meterName: meter.meterName,
          billingMonth: reading.billingMonth,
          unitsConsumed: reading.unitsConsumed,
          electricityAmount: reading.electricityAmount,
        },
      });

      return NextResponse.json({
        success: true,
        data: { reading, bill },
        message: `Reading for ${meter.meterName} approved! Electricity bill updated to ₹${totalElectricityAmount}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Meter reading review POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to process meter reading review';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
