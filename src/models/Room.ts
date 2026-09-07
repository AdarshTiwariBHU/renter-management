import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';

export interface IRoom extends Document {
  propertyId?: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  building: string;
  floor: number;
  roomNumber: string;
  roomType: 'Single' | 'Double' | '1BHK' | '2BHK' | 'Studio' | 'Shared';
  monthlyRentDefault: number;
  status: RoomStatus;
  currentRenterId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    property: { type: Schema.Types.ObjectId, ref: 'Property' },
    building: { type: String, default: 'Main Wing' },
    floor: { type: Number, required: true },
    roomNumber: { type: String, required: true, trim: true },
    roomType: {
      type: String,
      enum: ['Single', 'Double', '1BHK', '2BHK', 'Studio', 'Shared'],
      default: '1BHK',
    },
    monthlyRentDefault: { type: Number, required: true, default: 5000 },
    status: {
      type: String,
      enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'],
      default: 'VACANT',
    },
    currentRenterId: { type: Schema.Types.ObjectId, ref: 'Renter', default: null },
  },
  { timestamps: true }
);

RoomSchema.pre('save', function (next) {
  if (this.propertyId && !this.property) {
    this.property = this.propertyId;
  } else if (this.property && !this.propertyId) {
    this.propertyId = this.property;
  }
  next();
});

RoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ propertyId: 1, status: 1 });
RoomSchema.index({ status: 1 });

export default (mongoose.models.Room as Model<IRoom>) || mongoose.model<IRoom>('Room', RoomSchema);

