import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import Bill from '@/models/Bill';
import Meter from '@/models/Meter';
import MeterReading from '@/models/MeterReading';
import Payment from '@/models/Payment';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { verifySessionUser, isRenterRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !session.user.renterId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login as a renter.' }, { status: 401 });
    }

    const renterId = session.user.renterId;
    await connectToDatabase();

    const renter = await Renter.findById(renterId);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter profile not found' }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"

    // Fetch all related data in parallel (Requirement 31: Strict session-bound queries)
    const [bills, meters, readings, payments, transactions] = await Promise.all([
      Bill.find({ renterId }).sort({ billingMonth: -1 }),
      Meter.find({ renterId, isActive: true }),
      MeterReading.find({ renterId }).sort({ billingMonth: -1, readingDate: -1 }),
      Payment.find({ renterId }).sort({ paymentDate: -1 }),
      Transaction.find({ renterId }).sort({ date: -1 }),
    ]);

    // Current month bill or latest bill
    const currentMonthBill = bills.find((b) => b.billingMonth === currentMonth) || bills[0] || null;

    // Calculate overdue days if balance > 0
    let overdueDays = 0;
    if (currentMonthBill && currentMonthBill.balance > 0 && currentMonthBill.dueDate) {
      const today = new Date();
      const due = new Date(currentMonthBill.dueDate);
      if (today > due) {
        const diff = today.getTime() - due.getTime();
        overdueDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    }

    // Approved electricity consumption stats
    const approvedReadings = readings.filter((r) => r.status === 'APPROVED');
    const totalUnitsUsed = approvedReadings.reduce((sum, r) => sum + (r.unitsConsumed || 0), 0);
    const totalElectricityCost = approvedReadings.reduce((sum, r) => sum + (r.electricityAmount || 0), 0);

    // Latest approved reading info
    const latestApprovedReading = approvedReadings[0] || null;

    // Pending submission if any
    const pendingReading = readings.find((r) => r.status === 'PENDING_REVIEW') || null;

    return NextResponse.json({
      success: true,
      data: {
        currentMonth,
        renter: {
          _id: renter._id,
          fullName: renter.fullName,
          photoUrl: renter.photoUrl,
          fatherName: renter.fatherName,
          dob: renter.dob,
          mobile: renter.mobile,
          email: renter.email,
          permanentAddress: renter.permanentAddress,
          currentAddress: renter.currentAddress,
          aadhaarNumber: renter.aadhaarNumber,
          aadhaarFrontUrl: renter.aadhaarFrontUrl,
          aadhaarBackUrl: renter.aadhaarBackUrl,
          roomNumber: renter.roomNumber,
          monthlyRent: renter.monthlyRent,
          securityDeposit: renter.securityDeposit,
          rentDueDay: renter.rentDueDay,
          joiningDate: renter.joiningDate,
          status: renter.status,
          emergencyContactName: renter.emergencyContactName,
          emergencyContactNumber: renter.emergencyContactNumber,
        },
        currentMonthBill: currentMonthBill
          ? {
              _id: currentMonthBill._id,
              billingMonth: currentMonthBill.billingMonth,
              rentAmount: currentMonthBill.rentAmount,
              electricityAmount: currentMonthBill.electricityAmount,
              totalPayable: currentMonthBill.totalPayable,
              paidAmount: currentMonthBill.paidAmount,
              balance: currentMonthBill.balance,
              status: currentMonthBill.status,
              dueDate: currentMonthBill.dueDate,
              overdueDays,
              meterBreakdown: currentMonthBill.meterBreakdown || [],
            }
          : {
              billingMonth: currentMonth,
              rentAmount: renter.monthlyRent,
              electricityAmount: 0,
              totalPayable: renter.monthlyRent,
              paidAmount: 0,
              balance: renter.monthlyRent,
              status: 'PENDING',
              dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), renter.rentDueDay || 5),
              overdueDays: 0,
              meterBreakdown: [],
            },
        meters,
        readings,
        approvedReadings,
        pendingReading,
        latestApprovedReading,
        bills,
        payments,
        transactions,
        summary: {
          totalUnitsUsed,
          totalElectricityCost,
          totalOutstandingDue: bills.reduce((sum, b) => sum + (b.balance || 0), 0),
          totalPaidAcrossBills: bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
        },
      },
    });
  } catch (error: unknown) {
    console.error('Renter portal GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load renter dashboard' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await verifySessionUser(request);
    if (!session || !session.user.renterId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login as a renter.' }, { status: 401 });
    }

    const renterId = session.user.renterId;
    const body = await request.json();

    await connectToDatabase();
    const renter = await Renter.findById(renterId);
    if (!renter) {
      return NextResponse.json({ success: false, error: 'Renter profile not found' }, { status: 404 });
    }

    // Requirement 19: Renter CANNOT modify admin-controlled data
    // Only allow updating personal contact details
    if (body.mobile && body.mobile.trim()) renter.mobile = body.mobile.trim();
    if (body.email !== undefined) renter.email = body.email.trim();
    if (body.currentAddress !== undefined) renter.currentAddress = body.currentAddress.trim();
    if (body.emergencyContactName !== undefined) renter.emergencyContactName = body.emergencyContactName.trim();
    if (body.emergencyContactNumber !== undefined) renter.emergencyContactNumber = body.emergencyContactNumber.trim();
    if (body.photoUrl !== undefined) renter.photoUrl = body.photoUrl;

    await renter.save();

    await AuditLog.create({
      action: 'RENTER_PROFILE_UPDATED',
      performedBy: session.auth.username || renter.fullName,
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        mobile: renter.mobile,
        email: renter.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: renter,
      message: 'Your personal information was updated successfully.',
    });
  } catch (error: unknown) {
    console.error('Renter profile PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
