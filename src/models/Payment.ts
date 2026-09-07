import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface IPayment extends Document {
  propertyId?: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  billId?: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  receiptNumber: string;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', required: true },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
      default: 'UPI',
    },
    transactionReference: { type: String, default: '' },
    notes: { type: String, default: '' },
    receiptNumber: { type: String, required: true, unique: true },
    receivedBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

PaymentSchema.index({ propertyId: 1, paymentDate: -1 });
PaymentSchema.index({ renterId: 1, paymentDate: -1 });

export default (mongoose.models.Payment as Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);

