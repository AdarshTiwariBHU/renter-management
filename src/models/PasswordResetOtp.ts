import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordResetOtp extends Document {
  email: string;
  targetEmail: string;
  otp: string;
  userId?: mongoose.Types.ObjectId;
  verified: boolean;
  resetToken?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetOtpSchema = new Schema<IPasswordResetOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    targetEmail: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    resetToken: { type: String, sparse: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired OTPs after expiry
PasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetOtpSchema.index({ email: 1, verified: 1 });

export default (mongoose.models.PasswordResetOtp as Model<IPasswordResetOtp>) ||
  mongoose.model<IPasswordResetOtp>('PasswordResetOtp', PasswordResetOtpSchema);
