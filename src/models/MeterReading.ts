import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevisionEntry {
  previousReading: number;
  currentReading: number;
  revisedAt: Date;
  revisedBy?: string;
  reason?: string;
}

export type MeterReadingStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';

export interface IMeterReading extends Document {
  propertyId?: mongoose.Types.ObjectId;
  meterId: mongoose.Types.ObjectId;
  meterName: string;
  renterId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  billingMonth: string; // Format "YYYY-MM", e.g. "2026-09"
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  electricityAmount: number;
  readingDate: Date;
  photoUrl?: string;
  status: MeterReadingStatus;
  submittedBy: 'admin' | 'renter';
  rejectionReason?: string;
  notes?: string;
  isRevised: boolean;
  revisionHistory?: IRevisionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const RevisionEntrySchema = new Schema<IRevisionEntry>(
  {
    previousReading: { type: Number, required: true },
    currentReading: { type: Number, required: true },
    revisedAt: { type: Date, default: Date.now },
    revisedBy: { type: String, default: 'admin' },
    reason: { type: String },
  },
  { _id: false }
);

const MeterReadingSchema = new Schema<IMeterReading>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    meterId: { type: Schema.Types.ObjectId, ref: 'Meter', required: true },
    meterName: { type: String, required: true },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    billingMonth: { type: String, required: true, trim: true },
    previousReading: { type: Number, required: true },
    currentReading: { type: Number, required: true },
    unitsConsumed: { type: Number, required: true, min: 0 },
    ratePerUnit: { type: Number, required: true },
    electricityAmount: { type: Number, required: true, min: 0 },
    readingDate: { type: Date, default: Date.now },
    photoUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'],
      default: 'APPROVED',
    },
    submittedBy: {
      type: String,
      enum: ['admin', 'renter'],
      default: 'admin',
    },
    rejectionReason: { type: String, default: '' },
    notes: { type: String },
    isRevised: { type: Boolean, default: false },
    revisionHistory: [RevisionEntrySchema],
  },
  { timestamps: true }
);

MeterReadingSchema.index({ propertyId: 1, billingMonth: 1 });
MeterReadingSchema.index({ propertyId: 1, status: 1 });
MeterReadingSchema.index({ meterId: 1, billingMonth: 1 });
MeterReadingSchema.index({ renterId: 1, billingMonth: 1 });
MeterReadingSchema.index({ billingMonth: 1 });
MeterReadingSchema.index({ status: 1 });

export default (mongoose.models.MeterReading as Model<IMeterReading>) ||
  mongoose.model<IMeterReading>('MeterReading', MeterReadingSchema);

