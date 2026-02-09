import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  name: string; // รูปแบบ: repairRequest_DEPT_YYYY_MM (เช่น repairRequest_HK_2024_01)
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
