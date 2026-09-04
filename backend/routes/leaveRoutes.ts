import { Router, Request, Response } from 'express';
import { db } from '../db';
import { LeaveApplication, LeaveType, AttendanceRecord } from '../../src/types';

export const leaveRouter = Router();

// GET /api/leaves
leaveRouter.get('/', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  if (employeeId) {
    return res.json(db.leaves.filter(l => l.employeeId === String(employeeId)));
  }
  return res.json(db.leaves);
});

// POST /api/leaves
leaveRouter.post('/', (req: Request, res: Response) => {
  const { employeeId, leaveType, startDate, endDate, daysCount, reason } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const newLeave: LeaveApplication = {
    id: `LEV-${Date.now().toString().slice(-4)}`,
    employeeId,
    employeeName: employee.name,
    department: employee.department,
    leaveType: leaveType as LeaveType,
    startDate,
    endDate,
    daysCount: Number(daysCount) || 1,
    reason,
    status: 'pending',
    appliedOn: new Date().toISOString().split('T')[0],
  };

  db.leaves.unshift(newLeave);
  return res.status(201).json(newLeave);
});

// PATCH /api/leaves/:id/approve
leaveRouter.patch('/:id/approve', (req: Request, res: Response) => {
  const leave = db.leaves.find(l => l.id === req.params.id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave application not found' });
  }

  leave.status = 'approved';
  leave.reviewedBy = req.body.reviewedBy || 'Sunita Rao (HR)';
  leave.reviewedAt = new Date().toISOString().split('T')[0];

  // Deduct leave from employee's balance
  const employee = db.employees.find(e => e.id === leave.employeeId);
  if (employee) {
    const bal = employee.leaveBalance;
    if (leave.leaveType === 'Casual Leave') {
      bal.casualLeave = Math.max(0, bal.casualLeave - leave.daysCount);
    } else if (leave.leaveType === 'Sick Leave') {
      bal.sickLeave = Math.max(0, bal.sickLeave - leave.daysCount);
    } else if (leave.leaveType === 'Privilege Leave') {
      bal.privilegeLeave = Math.max(0, bal.privilegeLeave - leave.daysCount);
    } else {
      bal.lossOfPayDays += leave.daysCount;
    }
  }

  // Insert attendance record marked as 'on_leave'
  const leaveRec: AttendanceRecord = {
    id: `ATT-LEV-${Date.now()}`,
    employeeId: leave.employeeId,
    employeeName: leave.employeeName,
    department: leave.department,
    date: leave.startDate,
    checkInTime: null,
    checkOutTime: null,
    breaks: [],
    grossHours: 0,
    breakHours: 0,
    netWorkHours: 0,
    overtimeHours: 0,
    deficitHours: 8,
    status: 'on_leave',
    workLocation: 'Remote (WFH)',
    checkInNotes: `Approved Leave: ${leave.leaveType} (${leave.reason})`,
    isLate: false,
    lateMinutes: 0,
  };
  db.attendance.unshift(leaveRec);

  return res.json({ message: 'Leave approved and balance updated', leave });
});

// PATCH /api/leaves/:id/reject
leaveRouter.patch('/:id/reject', (req: Request, res: Response) => {
  const leave = db.leaves.find(l => l.id === req.params.id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave application not found' });
  }

  leave.status = 'rejected';
  leave.reviewedBy = req.body.reviewedBy || 'Sunita Rao (HR)';
  leave.reviewedAt = new Date().toISOString().split('T')[0];
  leave.rejectionReason = req.body.reason || 'Workplace deliverables schedule';

  return res.json({ message: 'Leave rejected', leave });
});
