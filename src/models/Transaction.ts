import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType =
  | 'DEBIT_BILL'
  | 'CREDIT_PAYMENT'
  | 'SECURITY_DEPOSIT'
  | 'DEPOSIT_REFUND'
  | 'ADJUSTMENT';

export interface ITransaction extends Document {
  propertyId?: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  date: Date;
  type: TransactionType;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  billId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  paymentMethod?: string;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    renterId: { type: Schema.Types.ObjectId, ref: 'Renter', required: true },
    date: { type: Date, required: true, default: Date.now },
    type: {
      type: String,
      enum: ['DEBIT_BILL', 'CREDIT_PAYMENT', 'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'ADJUSTMENT'],
      required: true,
    },
    description: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balanceAfter: { type: Number, required: true },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentMethod: { type: String },
    receiptNumber: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.index({ propertyId: 1, date: -1 });
TransactionSchema.index({ renterId: 1, date: -1 });
TransactionSchema.index({ date: -1 });

export default (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

