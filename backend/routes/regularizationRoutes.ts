import { Router, Request, Response } from 'express';
import { db } from '../db';
import { RegularizationRequest } from '../../src/types';
import { calculateAttendanceHours, STANDARD_SHIFT_START } from '../../src/utils/attendanceCalculations';

export const regularizationRouter = Router();

// GET /api/regularizations
regularizationRouter.get('/', (_req: Request, res: Response) => {
  res.json(db.regularizations);
});

// POST /api/regularizations
regularizationRouter.post('/', (req: Request, res: Response) => {
  const { employeeId, date, requestedCheckIn, requestedCheckOut, reason } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const newReg: RegularizationRequest = {
    id: `REG-${Date.now().toString().slice(-4)}`,
    employeeId,
    employeeName: employee.name,
    department: employee.department,
    date,
    requestedCheckIn,
    requestedCheckOut,
    reason,
    status: 'pending',
    appliedOn: new Date().toISOString().split('T')[0],
  };

  db.regularizations.unshift(newReg);
  return res.status(201).json(newReg);
});

// PATCH /api/regularizations/:id/approve
regularizationRouter.patch('/:id/approve', (req: Request, res: Response) => {
  const reg = db.regularizations.find(r => r.id === req.params.id);
  if (!reg) {
    return res.status(404).json({ error: 'Regularization request not found' });
  }

  reg.status = 'approved';

  const calculations = calculateAttendanceHours(
    reg.requestedCheckIn,
    reg.requestedCheckOut,
    0,
    STANDARD_SHIFT_START
  );

  const existingRecIndex = db.attendance.findIndex(r => r.employeeId === reg.employeeId && r.date === reg.date);
  if (existingRecIndex >= 0) {
    db.attendance[existingRecIndex] = {
      ...db.attendance[existingRecIndex],
      checkInTime: reg.requestedCheckIn,
      checkOutTime: reg.requestedCheckOut,
      isRegularized: true,
      ...calculations,
    };
  } else {
    db.attendance.unshift({
      id: `ATT-REG-${Date.now()}`,
      employeeId: reg.employeeId,
      employeeName: reg.employeeName,
      department: reg.department,
      date: reg.date,
      checkInTime: reg.requestedCheckIn,
      checkOutTime: reg.requestedCheckOut,
      breaks: [],
      isRegularized: true,
      workLocation: 'In-Office',
      checkInNotes: `Regularized: ${reg.reason}`,
      ...calculations,
    });
  }

  return res.json({ message: 'Regularization approved and attendance updated', regularization: reg });
});

// PATCH /api/regularizations/:id/reject
regularizationRouter.patch('/:id/reject', (req: Request, res: Response) => {
  const reg = db.regularizations.find(r => r.id === req.params.id);
  if (!reg) {
    return res.status(404).json({ error: 'Regularization request not found' });
  }
  reg.status = 'rejected';
  return res.json({ message: 'Regularization rejected', regularization: reg });
});
