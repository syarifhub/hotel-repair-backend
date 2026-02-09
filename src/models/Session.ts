import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  token: string;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    token: { type: String, required: true, unique: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ adminId: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
