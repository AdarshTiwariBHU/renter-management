import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/renters_management';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Clear existing collections
  const collections = ['users', 'properties', 'rooms', 'renters', 'meters', 'meterreadings', 'bills', 'payments', 'transactions', 'auditlogs'];
  for (const c of collections) {
    try {
      await mongoose.connection.collection(c).drop();
    } catch {
      // ignore if collection didn't exist
    }
  }
  console.log('Cleared existing collections.');

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await mongoose.connection.collection('users').insertOne({
    email: 'admin@renters.com',
    username: 'admin',
    passwordHash,
    name: 'Rajesh Sharma (Owner)',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Admin created: admin@renters.com / admin123');

  // 2. Create Property
  const property = await mongoose.connection.collection('properties').insertOne({
    name: 'Greenwood Residency',
    address: 'Plot 42, Silicon Enclave, Tech Zone 4, Greater Noida, UP - 201306',
    phone: '+91 98765 43210',
    email: 'admin@renters.com',
    defaultRentDueDay: 5,
    defaultElectricityRate: 10,
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Create 12 Rooms
  const roomData = [
    { roomNumber: '101', floor: 1, roomType: '1BHK', monthlyRentDefault: 7500 },
    { roomNumber: '102', floor: 1, roomType: 'Single', monthlyRentDefault: 5000 },
    { roomNumber: '103', floor: 1, roomType: 'Double', monthlyRentDefault: 6500 },
    { roomNumber: '104', floor: 1, roomType: 'Studio', monthlyRentDefault: 5500 },
    { roomNumber: '201', floor: 2, roomType: '2BHK', monthlyRentDefault: 12000 },
    { roomNumber: '202', floor: 2, roomType: '1BHK', monthlyRentDefault: 7500 },
    { roomNumber: '203', floor: 2, roomType: '1BHK', monthlyRentDefault: 7500 },
    { roomNumber: '204', floor: 2, roomType: 'Single', monthlyRentDefault: 5000 },
    { roomNumber: '301', floor: 3, roomType: '2BHK', monthlyRentDefault: 12500 },
    { roomNumber: '302', floor: 3, roomType: 'Studio', monthlyRentDefault: 6000 },
    { roomNumber: '303', floor: 3, roomType: '1BHK', monthlyRentDefault: 7500 },
    { roomNumber: '304', floor: 3, roomType: 'Single', monthlyRentDefault: 5000 },
  ];

  const roomIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const r of roomData) {
    const res = await mongoose.connection.collection('rooms').insertOne({
      property: property.insertedId,
      building: 'A-Wing',
      floor: r.floor,
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      monthlyRentDefault: r.monthlyRentDefault,
      status: 'VACANT',
      currentRenterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    roomIds[r.roomNumber] = res.insertedId;
  }
  console.log('Created 12 rooms.');

  // 4. Create 10 Sample Renters (9 Active + 1 Vacated)
  const rentersData = [
    {
      fullName: 'Rahul Kumar',
      fatherName: 'Suresh Kumar',
      motherName: 'Sunita Kumar',
      mobile: '9876543201',
      email: 'rahul.k@gmail.com',
      roomNumber: '101',
      monthlyRent: 7500,
      securityDeposit: 15000,
      rentDueDay: 5,
      permanentAddress: 'Village Baraut, Baghpat, UP',
      aadhaarNumber: '453210984567',
      joiningDate: new Date('2026-06-01'),
      status: 'ACTIVE',
      meters: [
        { name: 'Room Meter', starting: 1200, current: 1390, rate: 10 },
        { name: 'AC Meter', starting: 450, current: 580, rate: 12 },
      ],
    },
    {
      fullName: 'Priya Sharma',
      fatherName: 'Manoj Sharma',
      motherName: 'Kavita Sharma',
      mobile: '9876543202',
      email: 'priya.s@yahoo.com',
      roomNumber: '102',
      monthlyRent: 5000,
      securityDeposit: 10000,
      rentDueDay: 5,
      permanentAddress: 'H-42 Shastri Nagar, Jaipur, Rajasthan',
      aadhaarNumber: '784512963021',
      joiningDate: new Date('2026-06-15'),
      status: 'ACTIVE',
      meters: [{ name: 'Room Meter', starting: 800, current: 915, rate: 10 }],
    },
    {
      fullName: 'Amit Verma',
      fatherName: 'Dinesh Verma',
      motherName: 'Meena Verma',
      mobile: '9876543203',
      email: 'amit.verma@outlook.com',
      roomNumber: '103',
      monthlyRent: 6500,
      securityDeposit: 13000,
      rentDueDay: 5,
      permanentAddress: 'Plot 18, Govindpuri, Gwalior, MP',
      aadhaarNumber: '652398412034',
      joiningDate: new Date('2026-07-01'),
      status: 'ACTIVE',
      meters: [
        { name: 'Room Meter', starting: 2100, current: 2260, rate: 10 },
        { name: 'Geyser Meter', starting: 110, current: 145, rate: 10 },
      ],
    },
    {
      fullName: 'Sneha Patel',
      fatherName: 'Bhupendra Patel',
      motherName: 'Geeta Patel',
      mobile: '9876543204',
      email: 'sneha.patel@gmail.com',
      roomNumber: '104',
      monthlyRent: 5500,
      securityDeposit: 11000,
      rentDueDay: 5,
      permanentAddress: 'Near Subhash Chowk, Surat, Gujarat',
      aadhaarNumber: '951236478901',
      joiningDate: new Date('2026-07-10'),
      status: 'ACTIVE',
      meters: [{ name: 'Room Meter', starting: 3400, current: 3510, rate: 10 }],
    },
    {
      fullName: 'Vikram Singh',
      fatherName: 'Hardeep Singh',
      motherName: 'Jaspreet Kaur',
      mobile: '9876543205',
      email: 'vikram.singh@gmail.com',
      roomNumber: '201',
      monthlyRent: 12000,
      securityDeposit: 24000,
      rentDueDay: 5,
      permanentAddress: 'Model Town, Jalandhar, Punjab',
      aadhaarNumber: '842365197820',
      joiningDate: new Date('2026-06-01'),
      status: 'ACTIVE',
      meters: [
        { name: 'Main Meter', starting: 5100, current: 5420, rate: 10 },
        { name: 'Master AC', starting: 1200, current: 1410, rate: 12 },
      ],
    },
    {
      fullName: 'Ananya Roy',
      fatherName: 'Subhash Roy',
      motherName: 'Aparna Roy',
      mobile: '9876543206',
      email: 'ananya.roy@gmail.com',
      roomNumber: '202',
      monthlyRent: 7500,
      securityDeposit: 15000,
      rentDueDay: 5,
      permanentAddress: 'Salt Lake Sector 1, Kolkata, West Bengal',
      aadhaarNumber: '321456987012',
      joiningDate: new Date('2026-06-20'),
      status: 'ACTIVE',
      meters: [{ name: 'Room Meter', starting: 1750, current: 1890, rate: 10 }],
    },
    {
      fullName: 'Mohammad Tariq',
      fatherName: 'Abdul Tariq',
      motherName: 'Fatima Tariq',
      mobile: '9876543207',
      email: 'tariq.m@yahoo.com',
      roomNumber: '203',
      monthlyRent: 7500,
      securityDeposit: 15000,
      rentDueDay: 5,
      permanentAddress: 'Civil Lines, Aligarh, UP',
      aadhaarNumber: '654789321045',
      joiningDate: new Date('2026-07-05'),
      status: 'ACTIVE',
      meters: [{ name: 'Room Meter', starting: 920, current: 1045, rate: 10 }],
    },
    {
      fullName: 'Deepak Joshi',
      fatherName: 'Kailash Joshi',
      motherName: 'Lata Joshi',
      mobile: '9876543208',
      email: 'deepak.joshi@gmail.com',
      roomNumber: '204',
      monthlyRent: 5000,
      securityDeposit: 10000,
      rentDueDay: 5,
      permanentAddress: 'Mall Road, Nainital, Uttarakhand',
      aadhaarNumber: '147258369014',
      joiningDate: new Date('2026-08-01'),
      status: 'ACTIVE',
      meters: [{ name: 'Room Meter', starting: 600, current: 675, rate: 10 }],
    },
    {
      fullName: 'Ritu Deshmukh',
      fatherName: 'Sanjay Deshmukh',
      motherName: 'Sunanda Deshmukh',
      mobile: '9876543209',
      email: 'ritu.d@gmail.com',
      roomNumber: '301',
      monthlyRent: 12500,
      securityDeposit: 25000,
      rentDueDay: 5,
      permanentAddress: 'Kothrud, Pune, Maharashtra',
      aadhaarNumber: '963852741025',
      joiningDate: new Date('2026-07-15'),
      status: 'ACTIVE',
      meters: [
        { name: 'Main Meter', starting: 4200, current: 4490, rate: 10 },
        { name: 'AC Meter', starting: 890, current: 1050, rate: 12 },
      ],
    },
    {
      fullName: 'Karan Mehra',
      fatherName: 'Vijay Mehra',
      motherName: 'Sarita Mehra',
      mobile: '9876543210',
      email: 'karan.m@gmail.com',
      roomNumber: '302',
      monthlyRent: 6000,
      securityDeposit: 12000,
      rentDueDay: 5,
      permanentAddress: 'Sector 14, Chandigarh',
      aadhaarNumber: '852963741088',
      joiningDate: new Date('2026-04-01'),
      status: 'VACATED',
      vacatedDetails: {
        leavingDate: new Date('2026-08-25'),
        finalRentDue: 0,
        finalElectricityDue: 450,
        otherCharges: 200,
        securityDeposit: 12000,
        deductions: 650,
        refundAmount: 11350,
        settlementNotes: 'Deducted final electricity (₹450) and room cleaning (₹200). Refunded ₹11,350 via UPI.',
        settledAt: new Date('2026-08-25'),
      },
      meters: [{ name: 'Room Meter', starting: 1500, current: 1850, rate: 10 }],
    },
  ];

  const months = ['2026-07', '2026-08', '2026-09'];
  let receiptCounter = 100;

  for (const ren of rentersData) {
    const rId = roomIds[ren.roomNumber];

    const renterDoc = await mongoose.connection.collection('renters').insertOne({
      fullName: ren.fullName,
      photoUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000)}?w=150&h=150&fit=crop&crop=face`,
      fatherName: ren.fatherName,
      motherName: ren.motherName,
      mobile: ren.mobile,
      alternateMobile: '',
      email: ren.email,
      permanentAddress: ren.permanentAddress,
      currentAddress: ren.permanentAddress,
      aadhaarNumber: ren.aadhaarNumber,
      aadhaarFrontUrl: '',
      aadhaarBackUrl: '',
      otherDocumentUrl: '',
      roomId: rId,
      roomNumber: ren.roomNumber,
      joiningDate: ren.joiningDate,
      monthlyRent: ren.monthlyRent,
      securityDeposit: ren.securityDeposit,
      rentDueDay: ren.rentDueDay,
      status: ren.status,
      vacatedDetails: ren.vacatedDetails || null,
      createdAt: ren.joiningDate,
      updatedAt: new Date(),
    });

    const renterId = renterDoc.insertedId;

    // Update room occupancy
    if (ren.status === 'ACTIVE') {
      await mongoose.connection.collection('rooms').updateOne(
        { _id: rId },
        { $set: { status: 'OCCUPIED', currentRenterId: renterId } }
      );
    }

    // Security deposit transaction
    await mongoose.connection.collection('transactions').insertOne({
      renterId,
      date: ren.joiningDate,
      type: 'SECURITY_DEPOSIT',
      description: `Security Deposit Received - Room ${ren.roomNumber}`,
      debit: 0,
      credit: ren.securityDeposit,
      balanceAfter: 0,
      paymentMethod: 'UPI',
      receiptNumber: `REC-DEP-${ren.roomNumber}`,
      createdAt: ren.joiningDate,
      updatedAt: ren.joiningDate,
    });

    // Create meters & monthly history
    const createdMeters: { id: mongoose.Types.ObjectId; name: string; rate: number; current: number; starting: number }[] = [];

    for (const m of ren.meters) {
      const meterDoc = await mongoose.connection.collection('meters').insertOne({
        renterId,
        roomId: rId,
        meterName: m.name,
        startingReading: m.starting,
        currentReading: m.current,
        ratePerUnit: m.rate,
        isActive: ren.status === 'ACTIVE',
        createdAt: ren.joiningDate,
        updatedAt: new Date(),
      });
      createdMeters.push({
        id: meterDoc.insertedId,
        name: m.name,
        rate: m.rate,
        current: m.current,
        starting: m.starting,
      });
    }

    // Generate monthly readings, bills & payments across July, August, September
    let meterPrevReadings: Record<string, number> = {};
    for (const cm of createdMeters) {
      meterPrevReadings[cm.name] = cm.starting;
    }

    for (const [mIdx, mStr] of months.entries()) {
      // Check if renter had joined by this month
      const [year, month] = mStr.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      if (ren.joiningDate > new Date(year, month, 0)) {
        continue; // not joined yet
      }

      const isCurrentMonth = mStr === '2026-09';
      const isPastMonth = mIdx < 2;

      // Meter readings for this month
      let monthTotalElectricity = 0;
      const meterBreakdown = [];

      for (const cm of createdMeters) {
        const prev = meterPrevReadings[cm.name];
        // Generate realistic reading
        const units = Math.floor(Math.random() * 40) + 20; // 20 - 60 units
        const curr = prev + units;
        meterPrevReadings[cm.name] = curr;
        const amount = units * cm.rate;
        monthTotalElectricity += amount;

        await mongoose.connection.collection('meterreadings').insertOne({
          meterId: cm.id,
          meterName: cm.name,
          renterId,
          roomId: rId,
          billingMonth: mStr,
          previousReading: prev,
          currentReading: curr,
          unitsConsumed: units,
          ratePerUnit: cm.rate,
          electricityAmount: amount,
          readingDate: new Date(year, month - 1, 2),
          isRevised: false,
          revisionHistory: [],
          createdAt: new Date(year, month - 1, 2),
          updatedAt: new Date(year, month - 1, 2),
        });

        meterBreakdown.push({
          meterId: cm.id,
          meterName: cm.name,
          previousReading: prev,
          currentReading: curr,
          unitsConsumed: units,
          ratePerUnit: cm.rate,
          amount,
        });
      }

      const totalPayable = ren.monthlyRent + monthTotalElectricity;
      const dueDate = new Date(year, month - 1, ren.rentDueDay);

      // Determine payment status for demonstration
      let paidAmount = 0;
      let balance = totalPayable;
      let status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';

      if (isPastMonth) {
        // Past months are fully paid
        paidAmount = totalPayable;
        balance = 0;
        status = 'PAID';
      } else {
        // September 2026: demonstrate different states
        if (ren.roomNumber === '101') {
          // Partial payment
          paidAmount = 5000;
          balance = totalPayable - 5000;
          status = 'PARTIALLY_PAID';
        } else if (ren.roomNumber === '102') {
          // Fully paid
          paidAmount = totalPayable;
          balance = 0;
          status = 'PAID';
        } else if (ren.roomNumber === '103' || ren.roomNumber === '201') {
          // Overdue!
          paidAmount = 0;
          balance = totalPayable;
          status = 'OVERDUE';
        } else {
          // Pending or partial
          paidAmount = Math.random() > 0.5 ? 3000 : 0;
          balance = totalPayable - paidAmount;
          status = paidAmount > 0 ? 'PARTIALLY_PAID' : (new Date() > dueDate ? 'OVERDUE' : 'PENDING');
        }
      }

      const billDoc = await mongoose.connection.collection('bills').insertOne({
        renterId,
        roomId: rId,
        roomNumber: ren.roomNumber,
        billingMonth: mStr,
        rentAmount: ren.monthlyRent,
        electricityAmount: monthTotalElectricity,
        meterBreakdown,
        otherCharges: 0,
        otherChargesDescription: '',
        previousDue: 0,
        totalPayable,
        paidAmount,
        balance,
        status,
        dueDate,
        generatedAt: new Date(year, month - 1, 1),
        createdAt: new Date(year, month - 1, 1),
        updatedAt: new Date(),
      });

      // Debit ledger entry
      await mongoose.connection.collection('transactions').insertOne({
        renterId,
        date: new Date(year, month - 1, 1),
        type: 'DEBIT_BILL',
        description: `${mStr} Rent + Electricity Bill`,
        debit: totalPayable,
        credit: 0,
        balanceAfter: totalPayable,
        billId: billDoc.insertedId,
        createdAt: new Date(year, month - 1, 1),
        updatedAt: new Date(year, month - 1, 1),
      });

      // Credit ledger entry if payment was made
      if (paidAmount > 0) {
        receiptCounter++;
        const receiptNo = `REC-2026${String(month).padStart(2, '0')}-${receiptCounter}`;
        const payDate = new Date(year, month - 1, Math.min(5, new Date().getDate()));

        const payDoc = await mongoose.connection.collection('payments').insertOne({
          renterId,
          billId: billDoc.insertedId,
          amount: paidAmount,
          paymentDate: payDate,
          paymentMethod: 'UPI',
          transactionReference: `UPI${Date.now().toString().slice(-6)}${receiptCounter}`,
          notes: status === 'PARTIALLY_PAID' ? 'Partial rent payment received' : 'Full payment cleared',
          receiptNumber: receiptNo,
          receivedBy: 'Rajesh Sharma',
          createdAt: payDate,
          updatedAt: payDate,
        });

        await mongoose.connection.collection('transactions').insertOne({
          renterId,
          date: payDate,
          type: 'CREDIT_PAYMENT',
          description: `Payment Received via UPI (${mStr})`,
          debit: 0,
          credit: paidAmount,
          balanceAfter: balance,
          billId: billDoc.insertedId,
          paymentId: payDoc.insertedId,
          paymentMethod: 'UPI',
          receiptNumber: receiptNo,
          createdAt: payDate,
          updatedAt: payDate,
        });
      }
    }
  }

  console.log('Sample renters, meters, bills, payments, and ledger transactions populated successfully!');
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
