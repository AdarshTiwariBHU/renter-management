import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUploadedFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedFileSchema = new Schema<IUploadedFile>(
  {
    filename: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true, default: 'application/octet-stream' },
    size: { type: Number, required: true, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.UploadedFile as Model<IUploadedFile>) ||
  mongoose.model<IUploadedFile>('UploadedFile', UploadedFileSchema);
