import { Router, Request, Response } from 'express';
import { db } from '../db';
import { AttendanceRecord, WorkLocation } from '../../src/types';
import { 
  calculateAttendanceHours, 
  checkPunctuality, 
  timeStringToMinutes,
  STANDARD_SHIFT_START 
} from '../../src/utils/attendanceCalculations';

export const attendanceRouter = Router();

const getNowTimeString = (): string => {
  return new Date().toTimeString().split(' ')[0]; // "HH:mm:ss"
};

// GET /api/attendance
attendanceRouter.get('/', (req: Request, res: Response) => {
  const { date, department, employeeId, status } = req.query;
  let records = [...db.attendance];

  if (date) {
    records = records.filter(r => r.date === String(date));
  }
  if (department && department !== 'All') {
    records = records.filter(r => r.department === String(department));
  }
  if (employeeId) {
    records = records.filter(r => r.employeeId === String(employeeId));
  }
  if (status && status !== 'All') {
    records = records.filter(r => r.status === String(status));
  }

  res.json(records);
});

// POST /api/attendance/punch-in
attendanceRouter.post('/punch-in', (req: Request, res: Response) => {
  const { employeeId, workLocation, notes } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const todayDate = new Date().toISOString().split('T')[0];
  const punchTime = getNowTimeString();
  const punctuality = checkPunctuality(punchTime, employee.shiftStart || STANDARD_SHIFT_START);

  const existingIndex = db.attendance.findIndex(r => r.employeeId === employeeId && r.date === todayDate);

  const recordPayload: AttendanceRecord = {
    id: existingIndex >= 0 ? db.attendance[existingIndex].id : `ATT-${Date.now()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    date: todayDate,
    checkInTime: punchTime,
    checkOutTime: null,
    breaks: [],
    grossHours: 0,
    breakHours: 0,
    netWorkHours: 0,
    overtimeHours: 0,
    deficitHours: 8,
    status: punctuality.isLate ? 'late' : 'present',
    workLocation: (workLocation as WorkLocation) || 'In-Office',
    checkInNotes: notes || '',
    isLate: punctuality.isLate,
    lateMinutes: punctuality.lateMinutes,
  };

  if (existingIndex >= 0) {
    db.attendance[existingIndex] = {
      ...db.attendance[existingIndex],
      ...recordPayload,
    };
  } else {
    db.attendance.unshift(recordPayload);
  }

  const createdRecord = existingIndex >= 0 ? db.attendance[existingIndex] : db.attendance[0];
  return res.status(200).json({
    message: punctuality.isLate ? `Punched in late by ${punctuality.lateMinutes} mins` : 'Punched in on time',
    record: createdRecord,
  });
});

// POST /api/attendance/punch-out
attendanceRouter.post('/punch-out', (req: Request, res: Response) => {
  const { employeeId, notes } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const employee = db.employees.find(e => e.id === employeeId);
  const todayDate = new Date().toISOString().split('T')[0];
  const recordIndex = db.attendance.findIndex(r => r.employeeId === employeeId && r.date === todayDate);

  if (recordIndex < 0 || !db.attendance[recordIndex].checkInTime) {
    return res.status(400).json({ error: 'No active check-in record found for today' });
  }

  const record = db.attendance[recordIndex];
  const punchOutTime = getNowTimeString();
  const totalBreakMinutes = (record.breaks || []).reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

  const calculations = calculateAttendanceHours(
    record.checkInTime,
    punchOutTime,
    totalBreakMinutes,
    employee?.shiftStart || STANDARD_SHIFT_START
  );

  const updatedRecord: AttendanceRecord = {
    ...record,
    checkOutTime: punchOutTime,
    checkOutNotes: notes || record.checkOutNotes,
    ...calculations,
  };

  db.attendance[recordIndex] = updatedRecord;
  return res.json({
    message: 'Punched out successfully',
    record: updatedRecord,
  });
});

// POST /api/attendance/break/start
attendanceRouter.post('/break/start', (req: Request, res: Response) => {
  const { employeeId, reason } = req.body;
  const todayDate = new Date().toISOString().split('T')[0];
  const recordIndex = db.attendance.findIndex(r => r.employeeId === employeeId && r.date === todayDate);

  if (recordIndex < 0 || !db.attendance[recordIndex].checkInTime) {
    return res.status(400).json({ error: 'Must punch in before starting a break' });
  }

  const record = db.attendance[recordIndex];
  const startTime = getNowTimeString();

  const newBreak = {
    id: `BRK-${Date.now()}`,
    startTime,
    durationMinutes: 0,
    reason: reason || 'Lunch/Tea Break',
  };

  record.breaks = [...(record.breaks || []), newBreak];
  return res.json({ message: 'Break started', break: newBreak });
});

// POST /api/attendance/break/end
attendanceRouter.post('/break/end', (req: Request, res: Response) => {
  const { employeeId } = req.body;
  const todayDate = new Date().toISOString().split('T')[0];
  const recordIndex = db.attendance.findIndex(r => r.employeeId === employeeId && r.date === todayDate);

  if (recordIndex < 0) {
    return res.status(400).json({ error: 'No active attendance record found' });
  }

  const record = db.attendance[recordIndex];
  const endTime = getNowTimeString();

  record.breaks = (record.breaks || []).map(b => {
    if (!b.endTime) {
      const startMin = timeStringToMinutes(b.startTime);
      const endMin = timeStringToMinutes(endTime);
      const diff = Math.max(1, endMin - startMin);
      return {
        ...b,
        endTime,
        durationMinutes: diff,
      };
    }
    return b;
  });

  const totalBreakMins = record.breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
  record.breakHours = Number((totalBreakMins / 60).toFixed(2));

  return res.json({ message: 'Break concluded', breakHours: record.breakHours });
});
