import { RepairRequest } from '../models';

export interface MonthlyStats {
  byDepartment: { [key: string]: number };
  byStatus: { [key: string]: number };
  byEquipmentType: { [key: string]: number };
  totalRequests: number;
  month: number;
  year: number;
}

export interface MonthlyRequestsQuery {
  month: number;
  year: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ReportService {
  async getMonthlyStats(month: number, year: number): Promise<MonthlyStats> {
    const query = {
      createdMonth: month,
      createdYear: year
    };

    const [byDepartment, byStatus, byEquipmentType, total] = await Promise.all([
      RepairRequest.aggregate([
        { $match: query },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      RepairRequest.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      RepairRequest.aggregate([
        { $match: query },
        { $group: { _id: '$equipmentType', count: { $sum: 1 } } }
      ]),
      RepairRequest.countDocuments(query)
    ]);

    return {
      byDepartment: Object.fromEntries(byDepartment.map(item => [item._id, item.count])),
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      byEquipmentType: Object.fromEntries(byEquipmentType.map(item => [item._id, item.count])),
      totalRequests: total,
      month,
      year
    };
  }

  async getMonthlyRequests(query: MonthlyRequestsQuery) {
    const filter = {
      createdMonth: query.month,
      createdYear: query.year
    };

    const page = query.page || 1;
    const limit = query.limit || 20;
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      RepairRequest.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'fullName username'),
      RepairRequest.countDocuments(filter)
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAvailableMonths(): Promise<Array<{ month: number; year: number; count: number }>> {
    const result = await RepairRequest.aggregate([
      {
        $match: {
          createdMonth: { $exists: true },
          createdYear: { $exists: true }
        }
      },
      {
        $group: {
          _id: { month: '$createdMonth', year: '$createdYear' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    return result.map(item => ({
      month: item._id.month,
      year: item._id.year,
      count: item.count
    }));
  }
}

export const reportService = new ReportService();
