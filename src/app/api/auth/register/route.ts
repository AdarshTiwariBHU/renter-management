import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Renter from '@/models/Renter';
import AuditLog from '@/models/AuditLog';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      fatherName,
      dob,
      mobile,
      email,
      photoUrl,
      permanentAddress,
      currentAddress,
      aadhaarNumber,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      emergencyContactName,
      emergencyContactNumber,
      expectedJoiningDate,
      requestedPropertyId,
      requestedRoomNumber,
      loginId,
      password,
    } = body;

    // Validate mandatory fields
    if (!fullName || !fatherName || !mobile || !permanentAddress || !aadhaarNumber) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all mandatory personal and identity fields.' },
        { status: 400 }
      );
    }

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, error: 'Please choose a Login ID and password for your renter account.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanLoginId = loginId.trim().toLowerCase().replace(/\s+/g, '');
    if (cleanLoginId.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Login ID must be at least 3 characters.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanLoginId}@renter.local`;
    const existingUser = await User.findOne({
      $or: [
        { loginId: cleanLoginId },
        { username: cleanLoginId },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This Login ID or Email is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    // Check if an active renter already exists with this mobile or Aadhaar
    const cleanMobile = mobile.trim();
    const cleanAadhaar = aadhaarNumber.trim();
    const existingRenter = await Renter.findOne({
      status: { $in: ['ACTIVE', 'PENDING_VERIFICATION'] },
      $or: [{ mobile: cleanMobile }, { aadhaarNumber: cleanAadhaar }],
    });

    if (existingRenter) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A registration with this Mobile Number or Aadhaar Number is already active or awaiting verification.',
        },
        { status: 400 }
      );
    }

    // Create User record in PENDING_VERIFICATION state
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: cleanEmail,
      username: cleanLoginId,
      loginId: cleanLoginId,
      passwordHash,
      name: fullName.trim(),
      role: 'RENTER',
      status: 'PENDING_VERIFICATION',
      loginEnabled: false,
      createdBy: 'self',
    });

    // Create Renter record in PENDING_VERIFICATION state
    const renter = await Renter.create({
      fullName: fullName.trim(),
      photoUrl: photoUrl || '',
      fatherName: fatherName.trim(),
      dob: dob ? new Date(dob) : undefined,
      mobile: cleanMobile,
      email: cleanEmail,
      permanentAddress: permanentAddress.trim(),
      currentAddress: currentAddress?.trim() || permanentAddress.trim(),
      aadhaarNumber: cleanAadhaar,
      aadhaarFrontUrl: aadhaarFrontUrl || '',
      aadhaarBackUrl: aadhaarBackUrl || '',
      emergencyContactName: emergencyContactName?.trim() || '',
      emergencyContactNumber: emergencyContactNumber?.trim() || '',
      expectedJoiningDate: expectedJoiningDate ? new Date(expectedJoiningDate) : undefined,
      requestedPropertyId: requestedPropertyId || undefined,
      propertyId: requestedPropertyId || undefined,
      requestedRoomNumber: requestedRoomNumber?.trim() || '',
      monthlyRent: 0,
      securityDeposit: 0,
      rentDueDay: 5,
      status: 'PENDING_VERIFICATION',
      userId: user._id,
    });

    // Link renterId on User
    user.renterId = renter._id;
    await user.save();

    await AuditLog.create({
      action: 'RENTER_SELF_REGISTERED',
      performedBy: cleanLoginId,
      entityType: 'Renter',
      entityId: renter._id.toString(),
      details: {
        fullName: renter.fullName,
        mobile: renter.mobile,
        requestedRoom: requestedRoomNumber || 'None',
        ip: request.headers.get('x-forwarded-for') || 'local',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        renterId: renter._id,
        loginId: cleanLoginId,
        status: user.status,
        loginEnabled: user.loginEnabled,
      },
      message:
        'Your registration has been submitted successfully. Your account is waiting for admin verification.',
    });
  } catch (error: unknown) {
    console.error('Renter registration error:', error);
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
