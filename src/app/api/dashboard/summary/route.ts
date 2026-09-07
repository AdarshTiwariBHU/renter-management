import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Property from '@/models/Property';
import Renter from '@/models/Renter';
import Room from '@/models/Room';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';
import Transaction from '@/models/Transaction';
import MeterReading from '@/models/MeterReading';
import { ensureDefaultProperty } from '@/lib/propertyMigration';
import { verifySessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or session revoked. Please log in.', isRevoked: true },
        { status: 401 }
      );
    }

    await connectToDatabase();
    await ensureDefaultProperty();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const isFiltered = propertyId && propertyId !== 'ALL';
    let propObjId: mongoose.Types.ObjectId | null = null;
    let selectedProperty: any = null;

    if (isFiltered) {
      if (mongoose.Types.ObjectId.isValid(propertyId)) {
        propObjId = new mongoose.Types.ObjectId(propertyId);
        selectedProperty = await Property.findById(propObjId).lean();
      }
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Build scoped query filters
    const renterFilter: Record<string, unknown> = { status: 'ACTIVE' };
    const roomFilter: Record<string, unknown> = {};
    const occupiedRoomFilter: Record<string, unknown> = { status: 'OCCUPIED' };
    const vacantRoomFilter: Record<string, unknown> = { status: 'VACANT' };
    const paymentMatch: Record<string, unknown> = {
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    };
    const billMatch: Record<string, unknown> = { balance: { $gt: 0 } };
    const readingMatch: Record<string, unknown> = { billingMonth: currentMonth };
    const pendingReadingsFilter: Record<string, unknown> = { status: 'PENDING_REVIEW' };
    const pendingRenterFilter: Record<string, unknown> = { status: 'PENDING_VERIFICATION' };
    const transactionFilter: Record<string, unknown> = {};

    if (propObjId) {
      renterFilter.propertyId = propObjId;
      roomFilter.propertyId = propObjId;
      occupiedRoomFilter.propertyId = propObjId;
      vacantRoomFilter.propertyId = propObjId;
      paymentMatch.propertyId = propObjId;
      billMatch.propertyId = propObjId;
      readingMatch.propertyId = propObjId;
      pendingReadingsFilter.propertyId = propObjId;
      pendingRenterFilter.$or = [{ propertyId: propObjId }, { requestedPropertyId: propObjId }];
      transactionFilter.propertyId = propObjId;
    }

    // 1. Total Active Renters & Rooms
    const [
      totalRenters,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      pendingMeterReadings,
      pendingRenterRegistrations,
    ] = await Promise.all([
      Renter.countDocuments(renterFilter),
      Room.countDocuments(roomFilter),
      Room.countDocuments(occupiedRoomFilter),
      Room.countDocuments(vacantRoomFilter),
      MeterReading.countDocuments(pendingReadingsFilter),
      Renter.countDocuments(pendingRenterFilter),
    ]);

    // 2. Paid This Month
    const monthPayments = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const paidThisMonth = monthPayments[0]?.total || 0;

    // 3. Pending Amount (balance of active bills)
    const pendingBills = await Bill.aggregate([
      { $match: billMatch },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]);
    const pendingAmount = pendingBills[0]?.total || 0;

    // 4. Overdue Renters (bills where balance > 0 and dueDate < now)
    const overdueQuery: Record<string, unknown> = {
      ...billMatch,
      dueDate: { $lt: now },
    };
    const overdueBills = await Bill.find(overdueQuery).populate(
      'renterId',
      'fullName roomNumber mobile photoUrl'
    );

    const overdueRenterIds = new Set(
      overdueBills.map((b) => b.renterId?._id?.toString()).filter(Boolean)
    );
    const overdueRentersCount = overdueRenterIds.size;

    // 5. Electricity Collection this month
    const monthElectricityReadings = await MeterReading.aggregate([
      { $match: readingMatch },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$unitsConsumed' },
          totalAmount: { $sum: '$electricityAmount' },
        },
      },
    ]);
    const electricityCollection = monthElectricityReadings[0]?.totalAmount || 0;
    const electricityUnits = monthElectricityReadings[0]?.totalUnits || 0;

    // 6. Recent Transactions (last 5)
    const recentTransactions = await Transaction.find(transactionFilter)
      .populate('renterId', 'fullName roomNumber')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // 7. Recent Overdue Items (top 5 overdue)
    const overdueList = overdueBills.slice(0, 5).map((b) => {
      const diff = now.getTime() - new Date(b.dueDate).getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return {
        _id: b._id,
        renterName: (b.renterId as any)?.fullName || 'Unknown',
        roomNumber: b.roomNumber,
        mobile: (b.renterId as any)?.mobile || '',
        balance: b.balance,
        daysOverdue: days,
        billingMonth: b.billingMonth,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRenters,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        paidThisMonth,
        pendingAmount,
        overdueRenters: overdueRentersCount,
        electricityCollection,
        electricityUnits,
        currentMonth,
        pendingMeterReadings,
        pendingRenterRegistrations,
        selectedProperty: selectedProperty
          ? {
              _id: selectedProperty._id,
              name: selectedProperty.name,
              type: selectedProperty.type,
              address: selectedProperty.address,
              city: selectedProperty.city,
              status: selectedProperty.status,
            }
          : null,
        recentTransactions,
        overdueList,
      },
    });
  } catch (error: unknown) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate dashboard summary' },
      { status: 500 }
    );
  }
}
