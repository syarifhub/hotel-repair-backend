import mongoose, { Schema, Document } from 'mongoose';

export interface IRepairRequest extends Document {
  requestNumber: string; // รหัสสั้นๆ เช่น IT-0001
  equipmentType: 'Computer' | 'Printer' | 'CCTV' | 'UPS' | 'Software';
  department: 'Front Office' | 'Housekeeping' | 'Food & Beverage' | 'Engineering' | 'Accounting' | 'Sales & Marketing' | 'Security' | 'IT' | 'HR' | 'Other';
  title: string;
  problemDescription: string;
  reporterName: string;
  location?: string;
  status: 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'ยกเลิก';
  assignedTo?: mongoose.Types.ObjectId;
  
  // ฟิลด์ใหม่สำหรับการติดตามเดือน-ปี
  createdMonth?: number; // 1-12 (optional สำหรับความเข้ากันได้แบบย้อนหลัง)
  createdYear?: number; // เช่น 2024 (optional สำหรับความเข้ากันได้แบบย้อนหลัง)
  
  statusHistory: Array<{
    oldStatus?: string;
    newStatus: string;
    changedBy?: mongoose.Types.ObjectId;
    notes?: string;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RepairRequestSchema = new Schema<IRepairRequest>(
  {
    requestNumber: {
      type: String,
      unique: true,
      required: true
    },
    equipmentType: {
      type: String,
      required: true,
      enum: ['Computer', 'Printer', 'CCTV', 'UPS', 'Software']
    },
    department: {
      type: String,
      required: true,
      enum: ['Front Office', 'Housekeeping', 'Food & Beverage', 'Engineering', 'Accounting', 'Sales & Marketing', 'Security', 'IT', 'HR', 'Other']
    },
    title: { type: String, required: true },
    problemDescription: { type: String, required: true },
    reporterName: { type: String, required: true },
    location: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'],
      default: 'รอดำเนินการ'
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin' },
    createdMonth: { type: Number, min: 1, max: 12 }, // 1-12
    createdYear: { type: Number, min: 2000, max: 2100 }, // เช่น 2024
    statusHistory: [{
      oldStatus: String,
      newStatus: { type: String, required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
      notes: String,
      changedAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true
  }
);

RepairRequestSchema.index({ requestNumber: 1 }, { unique: true });
RepairRequestSchema.index({ status: 1 });
RepairRequestSchema.index({ equipmentType: 1 });
RepairRequestSchema.index({ department: 1 });
RepairRequestSchema.index({ createdAt: -1 });
RepairRequestSchema.index({ createdMonth: 1, createdYear: 1 }); // สำหรับการค้นหารายเดือน
RepairRequestSchema.index({ createdYear: 1, createdMonth: 1, department: 1 }); // สำหรับรายงาน

export const RepairRequest = mongoose.model<IRepairRequest>('RepairRequest', RepairRequestSchema);
