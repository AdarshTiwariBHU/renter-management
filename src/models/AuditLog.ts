import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  performedBy: string;
  entityType: 'Renter' | 'Bill' | 'Payment' | 'Meter' | 'MeterReading' | 'Room' | 'Auth' | 'User';
  entityId?: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, default: 'admin' },
    entityType: {
      type: String,
      enum: ['Renter', 'Bill', 'Payment', 'Meter', 'MeterReading', 'Room', 'Auth', 'User'],
      required: true,
    },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
