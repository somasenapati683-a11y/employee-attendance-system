import { Router, Request, Response } from 'express';
import { db } from '../db';

export const employeeRouter = Router();

// Get all employees
employeeRouter.get('/', (_req: Request, res: Response) => {
  const safeList = db.employees.map(({ password: _, ...e }) => e);
  res.json(safeList);
});

// Get employee by ID
employeeRouter.get('/:id', (req: Request, res: Response) => {
  const emp = db.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const { password: _, ...safeEmp } = emp;
  return res.json(safeEmp);
});
