import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import MeterReading from '@/models/MeterReading';
import Meter from '@/models/Meter';
import Renter from '@/models/Renter';
import Bill from '@/models/Bill';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';
import { calculateElectricity, calculateBill } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g. "2026-09"
    const renterId = searchParams.get('renterId');
    const meterId = searchParams.get('meterId');
    const propertyId = searchParams.get('propertyId');
    const sort = searchParams.get('sort') || 'newest';

    const filter: Record<string, unknown> = {};
    if (month && month !== 'ALL') filter.billingMonth = month;
    if (renterId) filter.renterId = renterId;
    if (meterId) filter.meterId = meterId;
    if (propertyId && propertyId !== 'ALL') filter.propertyId = propertyId;

    let sortOption: Record<string, 1 | -1> = { readingDate: -1 };
    if (sort === 'consumption_desc') sortOption = { unitsConsumed: -1 };
    else if (sort === 'consumption_asc') sortOption = { unitsConsumed: 1 };
    else if (sort === 'amount_desc') sortOption = { electricityAmount: -1 };
    else if (sort === 'amount_asc') sortOption = { electricityAmount: 1 };

    const readings = await MeterReading.find(filter)
      .populate('renterId', 'fullName roomNumber mobile')
      .sort(sortOption);

    const totalUnits = readings.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
    const totalAmount = readings.reduce((sum, r) => sum + (r.electricityAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: readings,
      summary: {
        totalUnits,
        totalAmount,
        count: readings.length,
      },
    });
  } catch (error: unknown) {
    console.error('Meter readings GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meter readings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      renterId,
      meterId,
      billingMonth, // "YYYY-MM"
      currentReading,
      isRevision = false,
      revisionReason = '',
      notes = '',
    } = body;

    if (!renterId || !meterId || !billingMonth || currentReading === undefined) {
      return NextResponse.json(
        { success: false, error: 'Renter, meter, billing month, and current reading are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const [renter, meter] = await Promise.all([
      Renter.findById(renterId),
      Meter.findById(meterId),
    ]);

    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }
    if (!meter) {
      return NextResponse.json({ success: false, error: 'Meter not found' }, { status: 404 });
    }

    const numCurrentReading = Number(currentReading);
    if (isNaN(numCurrentReading) || numCurrentReading < 0) {
      return NextResponse.json(
        { success: false, error: 'Current reading must be a valid positive number' },
        { status: 400 }
      );
    }

    // Check if a reading already exists for this meter & month
    const existingReading = await MeterReading.findOne({
      meterId: meter._id,
      billingMonth,
    });

    let previousReading = meter.currentReading ?? meter.startingReading ?? 0;
    const ratePerUnit = meter.ratePerUnit || 10;

    let savedReadingDoc;

    if (existingReading) {
      if (!isRevision) {
        return NextResponse.json(
          {
            success: false,
            error: `A reading for "${meter.meterName}" in ${billingMonth} already exists (${existingReading.currentReading} units). Enable revision to update it.`,
            isDuplicate: true,
          },
          { status: 400 }
        );
      }

      // Revisional update
      previousReading = existingReading.previousReading;
      if (numCurrentReading < previousReading) {
        return NextResponse.json(
          { success: false, error: 'Current meter reading cannot be lower than the previous reading.' },
          { status: 400 }
        );
      }

      const calc = calculateElectricity(previousReading, numCurrentReading, ratePerUnit);

      existingReading.revisionHistory = existingReading.revisionHistory || [];
      existingReading.revisionHistory.push({
        previousReading: existingReading.currentReading,
        currentReading: numCurrentReading,
        revisedAt: new Date(),
        revisedBy: auth.username,
        reason: revisionReason || 'Manual adjustment by admin',
      });

      existingReading.currentReading = numCurrentReading;
      existingReading.unitsConsumed = calc.unitsConsumed;
      existingReading.electricityAmount = calc.electricityAmount;
      existingReading.isRevised = true;
      existingReading.notes = notes || existingReading.notes;
      savedReadingDoc = await existingReading.save();

      // Update meter current reading if this is the most recent month
      meter.currentReading = numCurrentReading;
      await meter.save();
    } else {
      // New reading
      // Previous reading comes from latest recorded reading or startingReading
      const latestPriorReading = await MeterReading.findOne({
        meterId: meter._id,
        billingMonth: { $lt: billingMonth },
      }).sort({ billingMonth: -1 });

      if (latestPriorReading) {
        previousReading = latestPriorReading.currentReading;
      } else {
        previousReading = meter.startingReading || 0;
      }

      if (numCurrentReading < previousReading) {
        return NextResponse.json(
          { success: false, error: 'Current meter reading cannot be lower than the previous reading.' },
          { status: 400 }
        );
      }

      const calc = calculateElectricity(previousReading, numCurrentReading, ratePerUnit);

      savedReadingDoc = await MeterReading.create({
        propertyId: renter.propertyId,
        meterId: meter._id,
        meterName: meter.meterName,
        renterId: renter._id,
        roomId: renter.roomId,
        billingMonth,
        previousReading,
        currentReading: numCurrentReading,
        unitsConsumed: calc.unitsConsumed,
        ratePerUnit,
        electricityAmount: calc.electricityAmount,
        readingDate: new Date(),
        notes,
        isRevised: false,
      });

      // Update meter current reading
      meter.currentReading = numCurrentReading;
      await meter.save();
    }

    // --- Synchronize with current month's Bill ---
    // 1. Gather all meter readings for this renter in this billing month
    const allMonthReadings = await MeterReading.find({
      renterId: renter._id,
      billingMonth,
    });

    const totalElectricityAmount = allMonthReadings.reduce(
      (sum, r) => sum + (r.electricityAmount || 0),
      0
    );

    const meterBreakdown = allMonthReadings.map((r) => ({
      meterId: r.meterId,
      meterName: r.meterName,
      previousReading: r.previousReading,
      currentReading: r.currentReading,
      unitsConsumed: r.unitsConsumed,
      ratePerUnit: r.ratePerUnit,
      amount: r.electricityAmount,
    }));

    // Find or create the Bill
    let bill = await Bill.findOne({ renterId: renter._id, billingMonth });
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
      const [year, month] = billingMonth.split('-').map(Number);
      const dueDate = new Date(year, month - 1, renter.rentDueDay || 5);
      const billCalc = calculateBill(renter.monthlyRent, totalElectricityAmount, 0, 0, 0, dueDate);

      bill = await Bill.create({
        renterId: renter._id,
        roomId: renter.roomId,
        roomNumber: renter.roomNumber,
        billingMonth,
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
      action: isRevision ? 'METER_READING_REVISED' : 'METER_READING_RECORDED',
      performedBy: auth.username,
      entityType: 'MeterReading',
      entityId: savedReadingDoc._id.toString(),
      details: {
        meterName: meter.meterName,
        renterName: renter.fullName,
        billingMonth,
        currentReading: numCurrentReading,
        unitsConsumed: savedReadingDoc.unitsConsumed,
        electricityAmount: savedReadingDoc.electricityAmount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reading: savedReadingDoc,
        bill,
      },
      message: 'Meter reading updated successfully and synced with monthly bill',
    });
  } catch (error: unknown) {
    console.error('Meter reading POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to save meter reading';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
