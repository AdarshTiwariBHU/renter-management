import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Renter from '@/models/Renter';
import User from '@/models/User';
import Room from '@/models/Room';
import Property from '@/models/Property';
import Meter from '@/models/Meter';
import Bill from '@/models/Bill';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { getAuthFromRequest, hashPassword } from '@/lib/auth';
import { calculateBill } from '@/lib/calculations';
import { ensureDefaultProperty } from '@/lib/propertyMigration';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultProperty();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'ACTIVE';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const propertyId = searchParams.get('propertyId');

    const filter: Record<string, unknown> = {};

    if (status !== 'ALL') {
      filter.status = status;
    }

    if (propertyId && propertyId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(propertyId)) {
        filter.propertyId = new mongoose.Types.ObjectId(propertyId);
      }
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ fullName: regex }, { mobile: regex }, { roomNumber: regex }];
    }

    const renters = await Renter.find(filter)
      .populate('propertyId', 'name type address city status')
      .sort({ createdAt: -1 });

    // Fetch latest bill and meters for each renter to compute dynamic status
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const enrichedRenters = await Promise.all(
      renters.map(async (renter) => {
        const [latestBill, meters] = await Promise.all([
          Bill.findOne({ renterId: renter._id }).sort({ billingMonth: -1 }),
          Meter.find({ renterId: renter._id }),
        ]);

        let currentElectricity = 0;
        let totalDue = 0;
        let pStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
        let daysOverdue = 0;

        if (latestBill) {
          currentElectricity = latestBill.electricityAmount || 0;
          totalDue = latestBill.balance;
          pStatus = latestBill.status;

          if (totalDue > 0 && latestBill.dueDate) {
            const today = new Date();
            const due = new Date(latestBill.dueDate);
            if (today > due) {
              pStatus = 'OVERDUE';
              const diff = today.getTime() - due.getTime();
              daysOverdue = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
          }
        }

        const maxMeterReading = meters.reduce(
          (max, m) => Math.max(max, m.currentReading || m.startingReading || 0),
          0
        );

        return {
          _id: renter._id,
          fullName: renter.fullName,
          photoUrl: renter.photoUrl,
          roomNumber: renter.roomNumber,
          roomId: renter.roomId,
          mobile: renter.mobile,
          monthlyRent: renter.monthlyRent,
          currentElectricity,
          totalDue,
          paymentStatus: pStatus,
          daysOverdue,
          lastMeterReading: maxMeterReading,
          status: renter.status,
          metersCount: meters.length,
          joiningDate: renter.joiningDate,
        };
      })
    );

    // Apply paymentStatus filter in memory if requested
    const finalRenters =
      paymentStatus !== 'ALL'
        ? enrichedRenters.filter((r) => r.paymentStatus === paymentStatus)
        : enrichedRenters;

    return NextResponse.json({ success: true, data: finalRenters });
  } catch (error: unknown) {
    console.error('Renters GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renters' }, { status: 500 });
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
      propertyId,
      fullName,
      photoUrl,
      fatherName,
      motherName,
      mobile,
      alternateMobile,
      email,
      permanentAddress,
      currentAddress,
      aadhaarNumber,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      otherDocumentUrl,
      roomId,
      joiningDate,
      monthlyRent,
      securityDeposit,
      rentDueDay,
      meters = [],
      loginId,
      temporaryPassword,
    } = body;

    if (!fullName || !fatherName || !mobile || !permanentAddress || !aadhaarNumber || !roomId) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all mandatory renter details' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureDefaultProperty();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Selected room not found' }, { status: 404 });
    }

    let assignedPropertyId = room.propertyId;
    if (!assignedPropertyId) {
      const defaultProp = await Property.findOne({ status: 'ACTIVE' });
      assignedPropertyId = defaultProp?._id;
      room.propertyId = assignedPropertyId;
      await room.save();
    }

    if (propertyId && assignedPropertyId && assignedPropertyId.toString() !== propertyId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Selected room does not belong to the selected property' },
        { status: 400 }
      );
    }

    const property = await Property.findById(assignedPropertyId);
    if (property && property.status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, error: `Cannot assign renters to inactive property "${property.name}". Please activate it first.` },
        { status: 400 }
      );
    }

    if (room.status === 'OCCUPIED' && room.currentRenterId) {
      return NextResponse.json(
        { success: false, error: `Room ${room.roomNumber} is already occupied` },
        { status: 400 }
      );
    }

    // Create Renter
    const renter = await Renter.create({
      propertyId: assignedPropertyId,
      fullName: fullName.trim(),
      photoUrl: photoUrl || '',
      fatherName: fatherName.trim(),
      motherName: motherName?.trim() || '',
      mobile: mobile.trim(),
      alternateMobile: alternateMobile?.trim() || '',
      email: email?.trim() || '',
      permanentAddress: permanentAddress.trim(),
      currentAddress: currentAddress?.trim() || permanentAddress.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      aadhaarFrontUrl: aadhaarFrontUrl || '',
      aadhaarBackUrl: aadhaarBackUrl || '',
      otherDocumentUrl: otherDocumentUrl || '',
      roomId: room._id,
      roomNumber: room.roomNumber,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      monthlyRent: Number(monthlyRent) || room.monthlyRentDefault,
      securityDeposit: Number(securityDeposit) || 0,
      rentDueDay: Number(rentDueDay) || 5,
      status: 'ACTIVE',
    });

    // Update Room occupancy
    room.status = 'OCCUPIED';
    room.currentRenterId = renter._id;
    await room.save();

    // Create Meters (at least one default if none provided)
    const meterList =
      meters.length > 0
        ? meters
        : [{ meterName: 'Room Meter', startingReading: 0, ratePerUnit: 10 }];

    for (const m of meterList) {
      await Meter.create({
        propertyId: assignedPropertyId,
        renterId: renter._id,
        roomId: room._id,
        meterName: m.meterName || 'Room Meter',
        startingReading: Number(m.startingReading) || 0,
        currentReading: Number(m.startingReading) || 0,
        ratePerUnit: Number(m.ratePerUnit) || 10,
        isActive: true,
      });
    }

    // Security deposit transaction if > 0
    const depositAmount = renter.securityDeposit || 0;
    if (depositAmount > 0) {
      await Transaction.create({
        propertyId: assignedPropertyId,
        renterId: renter._id,
        date: renter.joiningDate || new Date(),
        type: 'SECURITY_DEPOSIT',
        description: `Security Deposit Received - Room ${room.roomNumber}`,
        debit: 0,
        credit: depositAmount,
        balanceAfter: 0,
        paymentMethod: 'CASH',
      });
    }

    // Automatically generate first month's bill
    const now = new Date(renter.joiningDate || Date.now());
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), renter.rentDueDay || 5);

    const rentAmount = renter.monthlyRent || 0;
    const billCalc = calculateBill(rentAmount, 0, 0, 0, 0, dueDate);

    const bill = await Bill.create({
      propertyId: assignedPropertyId,
      renterId: renter._id,
      roomId: room._id,
      roomNumber: room.roomNumber,
      billingMonth,
      rentAmount,
      electricityAmount: 0,
      meterBreakdown: [],
      otherCharges: 0,
      previousDue: 0,
      totalPayable: billCalc.totalPayable,
      paidAmount: 0,
      balance: billCalc.balance,
      status: billCalc.status,
      dueDate,
    });

    // Debit transaction for the monthly rent
    await Transaction.create({
      propertyId: assignedPropertyId,
      renterId: renter._id,
      date: now,
      type: 'DEBIT_BILL',
      description: `${billingMonth} Rent Bill Generated`,
      debit: renter.monthlyRent,
      credit: 0,
      balanceAfter: renter.monthlyRent,
      billId: bill._id,
    });

    // Create User Account for the Renter (Requirement 20 & 21: status = VERIFIED / ACTIVE, loginEnabled = true)
    let finalLoginId = loginId
      ? loginId.trim().toLowerCase().replace(/\s+/g, '')
      : (fullName.split(' ')[0].toLowerCase() + room.roomNumber.toLowerCase()).replace(/[^a-z0-9]/g, '');

    if (!finalLoginId || finalLoginId.length < 3) {
      finalLoginId = `renter${mobile.slice(-4)}`;
    }

    // Ensure uniqueness
    let counter = 1;
    const baseLoginId = finalLoginId;
    while (await User.findOne({ loginId: finalLoginId })) {
      finalLoginId = `${baseLoginId}${counter}`;
      counter++;
    }

    const finalTempPassword =
      temporaryPassword && temporaryPassword.trim().length >= 6
        ? temporaryPassword.trim()
        : `Pass@${Math.floor(1000 + Math.random() * 9000)}`;

    const passwordHash = await hashPassword(finalTempPassword);

    const user = await User.create({
      email: email ? email.trim().toLowerCase() : `${finalLoginId}@renter.local`,
      username: finalLoginId,
      loginId: finalLoginId,
      passwordHash,
      name: renter.fullName,
      role: 'RENTER',
      renterId: renter._id,
      status: 'ACTIVE',
      loginEnabled: true,
      mustChangePassword: true,
      createdBy: auth.username || 'admin',
    });

    renter.userId = user._id;
    await renter.save();

    await AuditLog.create({
      action: 'RENTER_CREATED',
      performedBy: auth.username,
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        renterName: renter.fullName,
        roomNumber: room.roomNumber,
        loginId: finalLoginId,
      },
    });

    return NextResponse.json({
      success: true,
      data: renter,
      credentials: {
        loginId: finalLoginId,
        temporaryPassword: finalTempPassword,
      },
      message: 'Renter added and login account activated successfully',
    });
  } catch (error: unknown) {
    console.error('Renter POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add renter' }, { status: 500 });
  }
}
