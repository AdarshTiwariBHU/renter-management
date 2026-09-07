import mongoose, { Schema, Document, Model } from 'mongoose';
import { PaymentStatus } from '../lib/calculations';

export interface IMeterBillItem {
  meterId: mongoose.Types.ObjectId;
  meterName: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
}

export interface IBill extends Document {
  propertyId?: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  roomNumber: string;
  billingMonth: string; // "YYYY-MM"
  rentAmount: number;
  electricityAmount: number;
  meterBreakdown: IMeterBillItem[];
  otherCharges: number;
  otherChargesDescription?: string;
  previousDue: number;
  totalPayable: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  dueDate: Date;
  generatedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeterBillItemSchema = new Schema<IMeterBillItem>(
  {
    meterId: { type: Schema.Types.ObjectId, ref: 'Meter', required: true },
    meterName: { type: String, required: true },
    previousReading: { type: Number, required: true },
    currentReading: { type: Number, required: true },
    unitsConsumed: { type: Number, required: true },
    ratePerUnit: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    roomNumber: { type: String, required: true },
    billingMonth: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, default: 0 },
    electricityAmount: { type: Number, required: true, default: 0 },
    meterBreakdown: [MeterBillItemSchema],
    otherCharges: { type: Number, default: 0 },
    otherChargesDescription: { type: String, default: '' },
    previousDue: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    balance: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE'],
      default: 'PENDING',
    },
    dueDate: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

BillSchema.index({ propertyId: 1, billingMonth: 1 });
BillSchema.index({ propertyId: 1, status: 1 });
BillSchema.index({ renterId: 1, billingMonth: 1 }, { unique: true });
BillSchema.index({ status: 1 });
BillSchema.index({ billingMonth: 1 });
BillSchema.index({ dueDate: 1 });

export default (mongoose.models.Bill as Model<IBill>) || mongoose.model<IBill>('Bill', BillSchema);

