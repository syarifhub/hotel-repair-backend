import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  email?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    lastLoginAt: { type: Date }
  },
  {
    timestamps: true
  }
);

AdminSchema.index({ username: 1 }, { unique: true });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
