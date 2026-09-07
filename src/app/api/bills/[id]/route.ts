import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Bill from '@/models/Bill';
import Renter from '@/models/Renter';
import Room from '@/models/Room';
import Property from '@/models/Property';
import Payment from '@/models/Payment';
import { calculateBill } from '@/lib/calculations';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    const [bill, property] = await Promise.all([
      Bill.findById(id).populate('renterId').populate('roomId'),
      Property.findOne(),
    ]);

    if (!bill) {
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    }

    const payments = await Payment.find({ billId: bill._id }).sort({ paymentDate: -1 });

    return NextResponse.json({
      success: true,
      data: {
        bill,
        property: property || {
          name: 'KirayaPro',
          address: '124 Park Avenue, Sector 5, City',
          phone: '+91 98765 43210',
          email: 'admin@renters.com',
        },
        payments,
      },
    });
  } catch (error: unknown) {
    console.error('Bill GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bill' }, { status: 500 });
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
    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    }

    if (body.otherCharges !== undefined) bill.otherCharges = Number(body.otherCharges);
    if (body.otherChargesDescription !== undefined)
      bill.otherChargesDescription = body.otherChargesDescription;
    if (body.notes !== undefined) bill.notes = body.notes;

    const calc = calculateBill(
      bill.rentAmount,
      bill.electricityAmount,
      bill.otherCharges,
      bill.previousDue,
      bill.paidAmount,
      bill.dueDate
    );

    bill.totalPayable = calc.totalPayable;
    bill.balance = calc.balance;
    bill.status = calc.status;

    await bill.save();

    return NextResponse.json({
      success: true,
      data: bill,
      message: 'Bill updated successfully',
    });
  } catch (error: unknown) {
    console.error('Bill PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update bill' }, { status: 500 });
  }
}
