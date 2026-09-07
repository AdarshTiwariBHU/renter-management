import mongoose, { Schema, Document, Model } from 'mongoose';

export type PropertyType =
  | 'Apartment'
  | 'House'
  | 'Hostel'
  | 'PG'
  | 'Building'
  | 'Commercial'
  | 'Other';

export type PropertyStatus = 'ACTIVE' | 'INACTIVE';

export interface IProperty extends Document {
  adminId?: mongoose.Types.ObjectId;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  photo?: string;
  description?: string;
  status: PropertyStatus;
  phone: string;
  email?: string;
  defaultRentDueDay: number;
  defaultElectricityRate: number;
  currency: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpHost?: string;
  smtpPort?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, default: 'KirayaPro Central' },
    type: {
      type: String,
      enum: ['Apartment', 'House', 'Hostel', 'PG', 'Building', 'Commercial', 'Other'],
      default: 'Building',
    },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pinCode: { type: String, default: '', trim: true },
    photo: { type: String, default: '' },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'admin@renters.com' },
    defaultRentDueDay: { type: Number, default: 5 },
    defaultElectricityRate: { type: Number, default: 10 },
    currency: { type: String, default: 'INR' },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpHost: { type: String, default: 'smtp.gmail.com' },
    smtpPort: { type: Number, default: 465 },
  },
  { timestamps: true }
);

PropertySchema.index({ adminId: 1 });
PropertySchema.index({ status: 1 });

export default (mongoose.models.Property as Model<IProperty>) ||
  mongoose.model<IProperty>('Property', PropertySchema);

