import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data'
      });
    }
  };
};

export const repairRequestSchema = z.object({
  equipmentType: z.enum(['Computer', 'Printer', 'CCTV', 'UPS', 'Software']),
  department: z.enum([
    'Front Office',
    'Housekeeping',
    'Food & Beverage',
    'Engineering',
    'Accounting',
    'Sales & Marketing',
    'Human Resources',
    'Reservation',
    'Other'
  ]),
  title: z.string().min(1, 'Title is required'),
  problemDescription: z.string().min(1, 'Problem description is required'),
  reporterName: z.string().min(1, 'Reporter name is required'),
  location: z.string().optional()
});

export const updateRequestSchema = z.object({
  status: z.enum(['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional()
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});
