import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Bill from '@/models/Bill';
import MeterReading from '@/models/MeterReading';
import Renter from '@/models/Renter';
import Room from '@/models/Room';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'collection'; // 'collection' | 'electricity' | 'pending' | 'occupancy'
    const month = searchParams.get('month'); // "YYYY-MM"
    const propertyId = searchParams.get('propertyId');

    const hasProperty = propertyId && propertyId !== 'ALL' && mongoose.Types.ObjectId.isValid(propertyId);
    const propObjId = hasProperty ? new mongoose.Types.ObjectId(propertyId) : null;

    if (type === 'collection') {
      const matchFilter: Record<string, unknown> = {};
      if (month && month !== 'ALL') {
        matchFilter.billingMonth = month;
      }
      if (propObjId) {
        matchFilter.propertyId = propObjId;
      }

      const bills = await Bill.find(matchFilter).sort({ billingMonth: -1 });

      // Group by month
      const grouped: Record<
        string,
        {
          month: string;
          totalRent: number;
          totalElectricity: number;
          totalOther: number;
          totalBilled: number;
          totalCollected: number;
          totalPending: number;
          billCount: number;
        }
      > = {};

      for (const b of bills) {
        const m = b.billingMonth;
        if (!grouped[m]) {
          grouped[m] = {
            month: m,
            totalRent: 0,
            totalElectricity: 0,
            totalOther: 0,
            totalBilled: 0,
            totalCollected: 0,
            totalPending: 0,
            billCount: 0,
          };
        }
        grouped[m].totalRent += b.rentAmount || 0;
        grouped[m].totalElectricity += b.electricityAmount || 0;
        grouped[m].totalOther += b.otherCharges || 0;
        grouped[m].totalBilled += b.totalPayable || 0;
        grouped[m].totalCollected += b.paidAmount || 0;
        grouped[m].totalPending += b.balance || 0;
        grouped[m].billCount += 1;
      }

      return NextResponse.json({
        success: true,
        data: Object.values(grouped),
      });
    }

    if (type === 'electricity') {
      const matchFilter: Record<string, unknown> = {};
      if (month && month !== 'ALL') {
        matchFilter.billingMonth = month;
      }
      if (propObjId) {
        matchFilter.propertyId = propObjId;
      }

      const readings = await MeterReading.find(matchFilter)
        .populate('renterId', 'fullName roomNumber')
        .sort({ unitsConsumed: -1 });

      const totalUnits = readings.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
      const totalAmount = readings.reduce((sum, r) => sum + (r.electricityAmount || 0), 0);

      const formatted = readings.map((r) => ({
        _id: r._id,
        renterName: (r.renterId as any)?.fullName || 'Unknown',
        roomNumber: (r.renterId as any)?.roomNumber || '—',
        meterName: r.meterName,
        month: r.billingMonth,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsConsumed: r.unitsConsumed,
        ratePerUnit: r.ratePerUnit,
        electricityAmount: r.electricityAmount,
        readingDate: r.readingDate,
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
        summary: {
          totalUnits,
          totalAmount,
          topConsumer: formatted[0] || null,
          lowestConsumer: formatted.length > 0 ? formatted[formatted.length - 1] : null,
        },
      });
    }

    if (type === 'pending') {
      const now = new Date();
      const matchFilter: Record<string, unknown> = { balance: { $gt: 0 } };
      if (propObjId) {
        matchFilter.propertyId = propObjId;
      }

      const bills = await Bill.find(matchFilter)
        .populate('renterId', 'fullName mobile roomNumber')
        .sort({ dueDate: 1 });

      const pendingList = bills.map((b) => {
        const due = new Date(b.dueDate);
        const diff = now.getTime() - due.getTime();
        const daysOverdue = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;

        return {
          _id: b._id,
          renterName: (b.renterId as any)?.fullName || 'Unknown',
          roomNumber: b.roomNumber,
          mobile: (b.renterId as any)?.mobile || '—',
          billingMonth: b.billingMonth,
          totalPayable: b.totalPayable,
          paidAmount: b.paidAmount,
          balance: b.balance,
          dueDate: b.dueDate,
          daysOverdue,
          status: daysOverdue > 0 ? 'OVERDUE' : b.status,
        };
      });

      return NextResponse.json({
        success: true,
        data: pendingList,
        summary: {
          totalPending: pendingList.reduce((sum, p) => sum + p.balance, 0),
          overdueCount: pendingList.filter((p) => p.daysOverdue > 0).length,
          count: pendingList.length,
        },
      });
    }

    if (type === 'occupancy') {
      const renterMatch: Record<string, unknown> = {};
      const roomMatch: Record<string, unknown> = {};
      if (propObjId) {
        renterMatch.propertyId = propObjId;
        roomMatch.propertyId = propObjId;
      }

      const [activeRenters, vacatedRenters, totalRooms, occupiedRooms, vacantRooms, maintenanceRooms] =
        await Promise.all([
          Renter.countDocuments({ ...renterMatch, status: 'ACTIVE' }),
          Renter.countDocuments({ ...renterMatch, status: 'VACATED' }),
          Room.countDocuments(roomMatch),
          Room.countDocuments({ ...roomMatch, status: 'OCCUPIED' }),
          Room.countDocuments({ ...roomMatch, status: 'VACANT' }),
          Room.countDocuments({ ...roomMatch, status: 'MAINTENANCE' }),
        ]);

      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      return NextResponse.json({
        success: true,
        data: {
          activeRenters,
          vacatedRenters,
          totalRooms,
          occupiedRooms,
          vacantRooms,
          maintenanceRooms,
          occupancyRate,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
