import express, { Express, Request, Response } from 'express';
import { db } from './db';
import { authRouter } from './routes/authRoutes';
import { employeeRouter } from './routes/employeeRoutes';
import { attendanceRouter } from './routes/attendanceRoutes';
import { leaveRouter } from './routes/leaveRoutes';
import { regularizationRouter } from './routes/regularizationRoutes';
import { deductionRouter } from './routes/deductionRoutes';

export function createBackendApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Service Health Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Inner Eye Attendance Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // Reset Endpoint for Evaluation Dataset
  app.post('/api/reset', (_req: Request, res: Response) => {
    db.reset();
    return res.json({ message: 'System database restored to benchmark seed dataset' });
  });

  // Mount Modular Routes
  app.use('/api/auth', authRouter);
  app.use('/api/employees', employeeRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/leaves', leaveRouter);
  app.use('/api/regularizations', regularizationRouter);
  app.use('/api/deductions', deductionRouter);

  return app;
}
