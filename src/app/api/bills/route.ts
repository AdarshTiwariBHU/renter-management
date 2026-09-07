import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Bill from '@/models/Bill';
import Renter from '@/models/Renter';
import MeterReading from '@/models/MeterReading';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';
import { calculateBill } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "YYYY-MM"
    const status = searchParams.get('status');
    const renterId = searchParams.get('renterId');
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search')?.trim();

    const filter: Record<string, unknown> = {};
    if (month && month !== 'ALL') filter.billingMonth = month;
    if (status && status !== 'ALL') filter.status = status;
    if (renterId) filter.renterId = renterId;
    if (propertyId && propertyId !== 'ALL') filter.propertyId = propertyId;

    const rawBills = await Bill.find(filter)
      .populate('propertyId', 'name type address city')
      .populate('renterId', 'fullName mobile photoUrl status')
      .sort({ billingMonth: -1, roomNumber: 1 })
      .lean();

    let billsList = rawBills;

    if (search) {
      const regex = new RegExp(search, 'i');
      billsList = billsList.filter((b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rName = (b.renterId as any)?.fullName || '';
        return regex.test(rName) || regex.test(b.roomNumber);
      });
    }

    // Dynamic overdue evaluation
    const today = new Date();
    const formattedBills = billsList.map((doc: any) => {
      if (doc.balance > 0 && doc.dueDate) {
        const due = new Date(doc.dueDate);
        if (today > due) {
          doc.status = 'OVERDUE';
          const diff = today.getTime() - due.getTime();
          doc.daysOverdue = Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
          doc.daysOverdue = 0;
        }
      } else {
        doc.daysOverdue = 0;
      }
      return doc;
    });

    const totalBilled = formattedBills.reduce((sum: number, b: any) => sum + (b.totalPayable || 0), 0);
    const totalCollected = formattedBills.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0);
    const totalPending = formattedBills.reduce((sum: number, b: any) => sum + (b.balance || 0), 0);

    return NextResponse.json({
      success: true,
      data: formattedBills,
      summary: {
        totalBilled,
        totalCollected,
        totalPending,
        count: formattedBills.length,
      },
    });
  } catch (error: unknown) {
    console.error('Bills GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billingMonth, propertyId } = body; // "YYYY-MM"

    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid billing month (YYYY-MM)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const renterQuery: Record<string, unknown> = { status: 'ACTIVE' };
    if (propertyId && propertyId !== 'ALL') {
      renterQuery.propertyId = propertyId;
    }

    const activeRenters = await Renter.find(renterQuery);
    let createdCount = 0;
    let skippedCount = 0;

    const [year, month] = billingMonth.split('-').map(Number);

    for (const renter of activeRenters) {
      const existing = await Bill.findOne({ renterId: renter._id, billingMonth });
      if (existing) {
        skippedCount++;
        continue;
      }

      // Check previous month balance
      const prevDate = new Date(year, month - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevBill = await Bill.findOne({ renterId: renter._id, billingMonth: prevMonth });
      const previousOutstanding = prevBill?.balance || 0;

      // Check any meter readings recorded for this month
      const monthReadings = await MeterReading.find({
        renterId: renter._id,
        billingMonth,
      });

      const totalElectricity = monthReadings.reduce((sum, r) => sum + (r.electricityAmount || 0), 0);
      const meterBreakdown = monthReadings.map((r) => ({
        meterId: r.meterId,
        meterName: r.meterName,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsConsumed: r.unitsConsumed,
        ratePerUnit: r.ratePerUnit,
        amount: r.electricityAmount,
      }));

      const dueDate = new Date(year, month - 1, renter.rentDueDay || 5);
      const calc = calculateBill(renter.monthlyRent, totalElectricity, 0, previousOutstanding, 0, dueDate);

      const bill = await Bill.create({
        propertyId: renter.propertyId,
        renterId: renter._id,
        roomId: renter.roomId,
        roomNumber: renter.roomNumber,
        billingMonth,
        rentAmount: renter.monthlyRent,
        electricityAmount: totalElectricity,
        meterBreakdown,
        otherCharges: 0,
        previousDue: previousOutstanding,
        totalPayable: calc.totalPayable,
        paidAmount: 0,
        balance: calc.balance,
        status: calc.status,
        dueDate,
      });

      // Ledger debit entry
      await Transaction.create({
        propertyId: renter.propertyId,
        renterId: renter._id,
        date: new Date(year, month - 1, 1),
        type: 'DEBIT_BILL',
        description: `${billingMonth} Bill Generated (Rent + Electricity)`,
        debit: calc.totalPayable,
        credit: 0,
        balanceAfter: calc.totalPayable,
        billId: bill._id,
      });

      createdCount++;
    }

    await AuditLog.create({
      action: 'BILLS_GENERATED',
      performedBy: auth.username,
      entityType: 'Bill',
      details: { billingMonth, createdCount, skippedCount },
    });

    return NextResponse.json({
      success: true,
      message: `Bills generated: ${createdCount} created, ${skippedCount} already existed.`,
      data: { createdCount, skippedCount },
    });
  } catch (error: unknown) {
    console.error('Bills POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate monthly bills' }, { status: 500 });
  }
}
