import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Transaction from '@/models/Transaction';
import Renter from '@/models/Renter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const renterId = searchParams.get('renterId');
    const type = searchParams.get('type');
    const limit = Number(searchParams.get('limit')) || 100;

    const filter: Record<string, unknown> = {};
    if (renterId) filter.renterId = renterId;
    if (type && type !== 'ALL') filter.type = type;

    const transactions = await Transaction.find(filter)
      .populate('renterId', 'fullName roomNumber mobile')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    const totalDebits = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredits = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalDebits,
        totalCredits,
        count: transactions.length,
      },
    });
  } catch (error: unknown) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
