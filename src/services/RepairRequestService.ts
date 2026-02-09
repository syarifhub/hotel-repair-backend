import mongoose from 'mongoose';
import { RepairRequest, IRepairRequest, Counter } from '../models';

export interface RepairRequestInput {
  equipmentType: 'Computer' | 'Printer' | 'CCTV' | 'UPS' | 'Software';
  department: string;
  title: string;
  problemDescription: string;
  reporterName: string;
  location?: string;
}

export interface RepairRequestUpdate {
  status?: 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'ยกเลิก';
  assignedTo?: string;
  notes?: string;
}

export interface RequestFilters {
  status?: string;
  equipmentType?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class RepairRequestService {
  // แปลงชื่อแผนกเป็นรหัสย่อ
  private getDepartmentCode(department: string): string {
    const codes: { [key: string]: string } = {
      'Front Office': 'FO',
      'Housekeeping': 'HK',
      'Food & Beverage': 'FB',
      'Engineering': 'ENG',
      'Accounting': 'ACC',
      'Sales & Marketing': 'SM',
      'Security': 'SEC',
      'IT': 'IT',
      'HR': 'HR',
      'Other': 'OTH'
    };
    return codes[department] || 'OTH';
  }

  // สร้างรหัสตามแผนกและเดือน เช่น HK-0001, IT-0001 (รีเซ็ตทุกเดือน)
  private async generateRequestNumber(department: string, retries: number = 3): Promise<string> {
    try {
      const deptCode = this.getDepartmentCode(department);
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      // รูปแบบใหม่: repairRequest_DEPT_YYYY_MM
      const counterName = `repairRequest_${deptCode}_${year}_${month}`;

      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const paddedNumber = counter.seq.toString().padStart(4, '0');
      return `${deptCode}-${paddedNumber}`;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying counter update, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        return this.generateRequestNumber(department, retries - 1);
      }
      throw new Error('Failed to generate request number after multiple attempts');
    }
  }

  async createRequest(data: RepairRequestInput): Promise<IRepairRequest> {
    const requestNumber = await this.generateRequestNumber(data.department);
    const now = new Date();
    
    const request = await RepairRequest.create({
      ...data,
      requestNumber,
      createdMonth: now.getMonth() + 1,  // 1-12
      createdYear: now.getFullYear(),
      status: 'รอดำเนินการ',
      statusHistory: [{
        newStatus: 'รอดำเนินการ',
        changedAt: now
      }]
    });

    return request;
  }

  async getRequestById(id: string): Promise<IRepairRequest | null> {
    // ถ้าเป็นรูปแบบ XX-XXXX (เช่น IT-0001, HK-0002) ให้ค้นหาด้วย requestNumber
    if (id.match(/^[A-Z]{2,3}-\d{4}$/)) {
      const request = await RepairRequest.findOne({ requestNumber: id })
        .populate('assignedTo', 'fullName username')
        .populate('statusHistory.changedBy', 'fullName username');
      return request;
    }

    // ถ้าเป็น MongoDB ObjectId ให้ค้นหาด้วย _id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const request = await RepairRequest.findById(id)
      .populate('assignedTo', 'fullName username')
      .populate('statusHistory.changedBy', 'fullName username');

    return request;
  }

  async updateRequest(
    id: string,
    updates: RepairRequestUpdate,
    adminId: string
  ): Promise<IRepairRequest> {
    try {
      const currentRequest = await RepairRequest.findById(id);

      if (!currentRequest) {
        throw new Error('Repair request not found');
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      if (updates.status) {
        updateData.status = updates.status;
        
        const historyEntry = {
          oldStatus: currentRequest.status,
          newStatus: updates.status,
          changedBy: new mongoose.Types.ObjectId(adminId),
          notes: updates.notes,
          changedAt: new Date()
        };

        updateData.$push = { statusHistory: historyEntry };
      }

      if (updates.assignedTo) {
        updateData.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
      }

      const updatedRequest = await RepairRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate('assignedTo', 'fullName username')
        .populate('statusHistory.changedBy', 'fullName username');
      
      if (!updatedRequest) {
        throw new Error('Failed to update request');
      }

      return updatedRequest;
    } catch (error) {
      throw error;
    }
  }

  async listRequests(filters: RequestFilters, pagination: Pagination) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.equipmentType) {
      query.equipmentType = filters.equipmentType;
    }

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const sortField = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const skip = (pagination.page - 1) * pagination.limit;

    const [requests, total] = await Promise.all([
      RepairRequest.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .populate('assignedTo', 'fullName username')
        .populate('statusHistory.changedBy', 'fullName username'),
      RepairRequest.countDocuments(query)
    ]);

    return {
      data: requests,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async getRequestHistory(id: string) {
    const request = await RepairRequest.findById(id)
      .populate('statusHistory.changedBy', 'fullName username');

    if (!request) {
      throw new Error('Repair request not found');
    }

    return request.statusHistory;
  }

  async getDashboardStats() {
    const [byStatus, byEquipmentType, byDepartment, total] = await Promise.all([
      RepairRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      RepairRequest.aggregate([
        { $group: { _id: '$equipmentType', count: { $sum: 1 } } }
      ]),
      RepairRequest.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      RepairRequest.countDocuments()
    ]);

    return {
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      byEquipmentType: Object.fromEntries(byEquipmentType.map(item => [item._id, item.count])),
      byDepartment: Object.fromEntries(byDepartment.map(item => [item._id, item.count])),
      totalRequests: total,
      lastUpdated: new Date()
    };
  }
}

export const repairRequestService = new RepairRequestService();
