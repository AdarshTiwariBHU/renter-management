import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Payment from '@/models/Payment';
import Bill from '@/models/Bill';
import Renter from '@/models/Renter';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';
import { determinePaymentStatus } from '@/lib/calculations';

function generateReceiptNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `REC-${dateStr}-${randomStr}`;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const renterId = searchParams.get('renterId');
    const billId = searchParams.get('billId');
    const paymentMethod = searchParams.get('method');
    const propertyId = searchParams.get('propertyId');

    const filter: Record<string, unknown> = {};
    if (renterId) filter.renterId = renterId;
    if (billId) filter.billId = billId;
    if (paymentMethod && paymentMethod !== 'ALL') filter.paymentMethod = paymentMethod;
    if (propertyId && propertyId !== 'ALL') filter.propertyId = propertyId;

    const payments = await Payment.find(filter)
      .populate('propertyId', 'name type address city')
      .populate('renterId', 'fullName roomNumber mobile')
      .populate('billId', 'billingMonth totalPayable balance status')
      .sort({ paymentDate: -1 });

    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: payments,
      summary: {
        totalCollected,
        count: payments.length,
      },
    });
  } catch (error: unknown) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
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
      billId,
      amount,
      paymentDate,
      paymentMethod = 'UPI',
      transactionReference = '',
      notes = '',
    } = body;

    const numAmount = Number(amount);
    if (!renterId || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide valid renter and positive payment amount' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const renter = await Renter.findById(renterId);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter not found' }, { status: 404 });
    }

    let targetBill = null;
    if (billId) {
      targetBill = await Bill.findById(billId);
    } else {
      // Auto-assign to oldest pending/unpaid bill for this renter
      targetBill = await Bill.findOne({
        renterId,
        balance: { $gt: 0 },
      }).sort({ billingMonth: 1 });
    }

    const receiptNumber = generateReceiptNumber();
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    // 1. Create Payment record
    const payment = await Payment.create({
      propertyId: renter.propertyId,
      renterId: renter._id,
      billId: targetBill?._id || null,
      amount: numAmount,
      paymentDate: pDate,
      paymentMethod,
      transactionReference,
      notes,
      receiptNumber,
      receivedBy: auth.name || auth.username,
    });

    // 2. Update Bill balance and status
    let remainingBalance = 0;
    if (targetBill) {
      targetBill.paidAmount = Math.round((targetBill.paidAmount + numAmount) * 100) / 100;
      targetBill.balance = Math.max(
        0,
        Math.round((targetBill.totalPayable - targetBill.paidAmount) * 100) / 100
      );
      targetBill.status = determinePaymentStatus(
        targetBill.balance,
        targetBill.paidAmount,
        targetBill.dueDate
      );
      await targetBill.save();
      remainingBalance = targetBill.balance;
    }

    // 3. Create immutable Transaction ledger entry
    await Transaction.create({
      propertyId: renter.propertyId,
      renterId: renter._id,
      date: pDate,
      type: 'CREDIT_PAYMENT',
      description: `Payment Received via ${paymentMethod}${
        targetBill ? ` (${targetBill.billingMonth})` : ''
      }`,
      debit: 0,
      credit: numAmount,
      balanceAfter: remainingBalance,
      billId: targetBill?._id,
      paymentId: payment._id,
      paymentMethod,
      receiptNumber,
    });

    await AuditLog.create({
      action: 'PAYMENT_RECORDED',
      performedBy: auth.username,
      entityType: 'Payment',
      entityId: payment._id.toString(),
      details: {
        renterName: renter.fullName,
        amount: numAmount,
        method: paymentMethod,
        receiptNumber,
        billMonth: targetBill?.billingMonth,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payment,
        bill: targetBill,
        receiptNumber,
      },
      message: 'Payment recorded successfully',
    });
  } catch (error: unknown) {
    console.error('Payment POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record payment' }, { status: 500 });
  }
}
