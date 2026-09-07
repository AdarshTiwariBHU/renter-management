import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'ADMIN' | 'RENTER' | 'admin' | 'manager';
export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'VACATED';

export interface IUser extends Document {
  email: string;
  username: string;
  loginId?: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  renterId?: mongoose.Types.ObjectId;
  status: UserStatus;
  loginEnabled: boolean;
  mustChangePassword?: boolean;
  rejectionReason?: string;
  avatarUrl?: string;
  mobile?: string;
  tokenVersion?: number;
  lastLoginAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    loginId: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['ADMIN', 'RENTER', 'admin', 'manager'],
      default: 'ADMIN',
    },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', sparse: true },
    status: {
      type: String,
      enum: [
        'PENDING_VERIFICATION',
        'ACTIVE',
        'VERIFIED',
        'REJECTED',
        'SUSPENDED',
        'VACATED',
      ],
      default: 'ACTIVE',
    },
    loginEnabled: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    mobile: { type: String, default: '' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

UserSchema.index({ status: 1 });

export default (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);
