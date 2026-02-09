import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  requestId: mongoose.Types.ObjectId;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  retryCount: number;
  sentAt?: Date;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'RepairRequest', required: true },
    status: { type: String, required: true, enum: ['success', 'failed', 'pending'] },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    sentAt: { type: Date }
  },
  {
    timestamps: true
  }
);

NotificationLogSchema.index({ requestId: 1 });
NotificationLogSchema.index({ status: 1 });
NotificationLogSchema.index({ createdAt: -1 });

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
