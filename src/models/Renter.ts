import mongoose, { Schema, Document, Model } from 'mongoose';

export type RenterStatus = 'ACTIVE' | 'VACATED' | 'PENDING_VERIFICATION' | 'REJECTED';

export interface IVacatedDetails {
  leavingDate: Date;
  finalMeterReadings?: {
    meterId: mongoose.Types.ObjectId;
    meterName: string;
    reading: number;
  }[];
  finalRentDue: number;
  finalElectricityDue: number;
  otherCharges: number;
  securityDeposit: number;
  deductions: number;
  refundAmount: number;
  settlementNotes?: string;
  settledAt: Date;
}

export interface IRenter extends Document {
  fullName: string;
  photoUrl?: string;
  fatherName: string;
  motherName?: string;
  dob?: Date;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  permanentAddress: string;
  currentAddress?: string;
  aadhaarNumber: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  otherDocumentUrl?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  expectedJoiningDate?: Date;
  requestedPropertyId?: mongoose.Types.ObjectId;
  requestedRoomNumber?: string;
  propertyId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  roomNumber?: string;
  joiningDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  rentDueDay: number;
  status: RenterStatus;
  userId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  vacatedDetails?: IVacatedDetails;
  createdAt: Date;
  updatedAt: Date;
}

const VacatedDetailsSchema = new Schema<IVacatedDetails>(
  {
    leavingDate: { type: Date, required: true },
    finalMeterReadings: [
      {
        meterId: { type: Schema.Types.ObjectId, ref: 'Meter' },
        meterName: { type: String },
        reading: { type: Number },
      },
    ],
    finalRentDue: { type: Number, default: 0 },
    finalElectricityDue: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    settlementNotes: { type: String },
    settledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RenterSchema = new Schema<IRenter>(
  {
    fullName: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '' },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, trim: true, default: '' },
    mobile: { type: String, required: true, trim: true },
    alternateMobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    permanentAddress: { type: String, required: true, trim: true },
    currentAddress: { type: String, trim: true, default: '' },
    aadhaarNumber: { type: String, required: true, trim: true },
    aadhaarFrontUrl: { type: String, default: '' },
    aadhaarBackUrl: { type: String, default: '' },
    otherDocumentUrl: { type: String, default: '' },
    emergencyContactName: { type: String, default: '' },
    emergencyContactNumber: { type: String, default: '' },
    expectedJoiningDate: { type: Date },
    requestedPropertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    requestedRoomNumber: { type: String, default: '' },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: false },
    roomNumber: { type: String, default: '' },
    joiningDate: { type: Date, default: Date.now },
    monthlyRent: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    rentDueDay: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['ACTIVE', 'VACATED', 'PENDING_VERIFICATION', 'REJECTED'],
      default: 'ACTIVE',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    rejectionReason: { type: String, default: '' },
    vacatedDetails: { type: VacatedDetailsSchema, default: null },
  },
  { timestamps: true }
);

RenterSchema.index({ fullName: 'text', mobile: 'text', roomNumber: 'text' });
RenterSchema.index({ propertyId: 1 });
RenterSchema.index({ status: 1 });
RenterSchema.index({ roomId: 1 });
RenterSchema.index({ mobile: 1 });

export default (mongoose.models.Renter as Model<IRenter>) ||
  mongoose.model<IRenter>('Renter', RenterSchema);

