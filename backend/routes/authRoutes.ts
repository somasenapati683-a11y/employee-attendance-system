import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Employee } from '../../src/types';

export const authRouter = Router();

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const employee = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
  if (!employee) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (password && employee.password && employee.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password: _, ...safeUser } = employee;
  return res.json({
    token: `jwt-mock-token-${employee.id}-${Date.now()}`,
    user: safeUser,
  });
});

// Register
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role, department, designation, employeeId, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Employee with this email already exists' });
  }

  const newEmp: Employee = {
    id: employeeId || `IEC-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email,
    password: password || 'password123',
    role: role || 'employee',
    department: department || 'Engineering',
    designation: designation || 'Associate Consultant',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    joiningDate: new Date().toISOString().split('T')[0],
    leaveBalance: {
      casualLeave: 12.0,
      sickLeave: 8.0,
      privilegeLeave: 15.0,
      lossOfPayDays: 0,
    },
    phone: phone || '+91 98000 00000',
  };

  db.employees.push(newEmp);
  const { password: _, ...safeUser } = newEmp;
  return res.status(201).json({ user: safeUser });
});
