import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Meter from '@/models/Meter';
import MeterReading from '@/models/MeterReading';
import Renter from '@/models/Renter';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser } from '@/lib/auth';
import { calculateElectricity } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !session.user.renterId) {
      return NextResponse.json({ success: false, error: 'Unauthorized renter access' }, { status: 403 });
    }

    const renterId = session.user.renterId;
    await connectToDatabase();

    const [renter, meters] = await Promise.all([
      Renter.findById(renterId),
      Meter.find({ renterId, isActive: true }),
    ]);

    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter profile not found' }, { status: 404 });
    }

    // For each meter, get the latest approved reading and any pending submission
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"

    const metersWithStatus = await Promise.all(
      meters.map(async (m) => {
        const [latestApproved, currentMonthReading] = await Promise.all([
          MeterReading.findOne({
            meterId: m._id,
            status: 'APPROVED',
          }).sort({ billingMonth: -1, readingDate: -1 }),
          MeterReading.findOne({
            meterId: m._id,
            billingMonth: currentMonth,
          }).sort({ createdAt: -1 }),
        ]);

        const previousReading = latestApproved
          ? latestApproved.currentReading
          : m.startingReading ?? 0;

        return {
          _id: m._id,
          meterName: m.meterName,
          ratePerUnit: m.ratePerUnit || 10,
          previousReading,
          latestApprovedReading: latestApproved,
          currentMonthReading,
          hasPendingSubmission: currentMonthReading?.status === 'PENDING_REVIEW',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        currentMonth,
        meters: metersWithStatus,
      },
    });
  } catch (error: unknown) {
    console.error('Renter meters GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !session.user.renterId) {
      return NextResponse.json({ success: false, error: 'Unauthorized renter access' }, { status: 403 });
    }

    const renterId = session.user.renterId;
    const body = await request.json();
    const { meterId, billingMonth, currentReading, photoUrl } = body;

    // Requirement 10: Mandatory Photo Validation
    if (!photoUrl || !photoUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'Meter photograph is required to submit the reading.' },
        { status: 400 }
      );
    }

    if (!meterId || !billingMonth || currentReading === undefined) {
      return NextResponse.json(
        { success: false, error: 'Meter, billing month, and current reading are required.' },
        { status: 400 }
      );
    }

    const numReading = Number(currentReading);
    if (isNaN(numReading) || numReading < 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid reading number.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const [renter, meter] = await Promise.all([
      Renter.findById(renterId),
      Meter.findOne({ _id: meterId, renterId, isActive: true }),
    ]);

    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter profile not found' }, { status: 404 });
    }
    if (!meter) {
      return NextResponse.json({ success: false, error: 'Meter not found or inactive' }, { status: 404 });
    }

    // Determine previous approved reading
    const latestPriorReading = await MeterReading.findOne({
      meterId: meter._id,
      billingMonth: { $lte: billingMonth },
      status: 'APPROVED',
    }).sort({ billingMonth: -1 });

    const previousReading = latestPriorReading
      ? latestPriorReading.currentReading
      : meter.startingReading ?? 0;

    if (numReading < previousReading) {
      return NextResponse.json(
        {
          success: false,
          error: `Current reading (${numReading}) cannot be less than previous approved reading (${previousReading}).`,
        },
        { status: 400 }
      );
    }

    const ratePerUnit = meter.ratePerUnit || 10;
    const calc = calculateElectricity(previousReading, numReading, ratePerUnit);

    // Check existing reading for this month
    let existingReading = await MeterReading.findOne({
      meterId: meter._id,
      billingMonth,
    });

    if (existingReading && existingReading.status === 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: `Reading for ${meter.meterName} in ${billingMonth} is already approved and finalized.`,
        },
        { status: 400 }
      );
    }

    let savedDoc;
    if (existingReading) {
      existingReading.previousReading = previousReading;
      existingReading.currentReading = numReading;
      existingReading.unitsConsumed = calc.unitsConsumed;
      existingReading.ratePerUnit = ratePerUnit;
      existingReading.electricityAmount = calc.electricityAmount;
      existingReading.photoUrl = photoUrl;
      existingReading.status = 'PENDING_REVIEW';
      existingReading.submittedBy = 'renter';
      existingReading.rejectionReason = '';
      existingReading.readingDate = new Date();
      savedDoc = await existingReading.save();
    } else {
      savedDoc = await MeterReading.create({
        meterId: meter._id,
        meterName: meter.meterName,
        renterId: renter._id,
        roomId: renter.roomId,
        billingMonth,
        previousReading,
        currentReading: numReading,
        unitsConsumed: calc.unitsConsumed,
        ratePerUnit,
        electricityAmount: calc.electricityAmount,
        readingDate: new Date(),
        photoUrl,
        status: 'PENDING_REVIEW',
        submittedBy: 'renter',
        isRevised: false,
      });
    }

    await AuditLog.create({
      action: 'METER_READING_SUBMITTED',
      performedBy: session.auth.username || renter.fullName,
      entityType: 'MeterReading',
      entityId: savedDoc._id.toString(),
      details: {
        renterName: renter.fullName,
        meterName: meter.meterName,
        billingMonth,
        currentReading: numReading,
        photoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: savedDoc,
      message: 'Meter reading submitted successfully. Waiting for admin approval.',
    });
  } catch (error: unknown) {
    console.error('Renter meter submission error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to submit reading';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
