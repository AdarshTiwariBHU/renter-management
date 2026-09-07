import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeter extends Document {
  propertyId?: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  meterName: string;
  startingReading: number;
  currentReading: number;
  ratePerUnit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeterSchema = new Schema<IMeter>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    meterName: { type: String, required: true, trim: true, default: 'Room Meter' },
    startingReading: { type: Number, required: true, default: 0 },
    currentReading: { type: Number, required: true, default: 0 },
    ratePerUnit: { type: Number, required: true, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MeterSchema.index({ propertyId: 1 });
MeterSchema.index({ renterId: 1, meterName: 1 });

export default (mongoose.models.Meter as Model<IMeter>) ||
  mongoose.model<IMeter>('Meter', MeterSchema);

