import { Router, Request, Response } from 'express';
import { db } from '../db';
import { computeEmployeeLeaveDeductions } from '../../src/utils/attendanceCalculations';

export const deductionRouter = Router();

// GET /api/deductions
deductionRouter.get('/', (_req: Request, res: Response) => {
  const auditReport = db.employees.map(emp => {
    const deductionAnalysis = computeEmployeeLeaveDeductions(
      emp.id,
      emp.name,
      db.attendance,
      emp.leaveBalance
    );
    return {
      employee: {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        leaveBalance: emp.leaveBalance,
      },
      ...deductionAnalysis,
    };
  });
  return res.json(auditReport);
});
