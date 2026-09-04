export type UserRole = 'employee' | 'hr_admin';

export type Department = 
  | 'Engineering'
  | 'Design'
  | 'Product'
  | 'Human Resources'
  | 'Marketing'
  | 'Operations'
  | 'Finance';

export type WorkLocation = 'In-Office' | 'Remote (WFH)' | 'Client Site';

export type AttendanceStatus = 
  | 'present'       // On time >= 8 hrs
  | 'late'          // Checked in after grace period (09:15 AM)
  | 'half_day'      // Worked < 4 hours
  | 'absent'        // Did not punch in
  | 'on_leave'      // Approved leave
  | 'holiday'       // Public holiday or weekend
  | 'overtime';     // Worked > 8.5 hours

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Privilege Leave' | 'Loss of Pay';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface BreakSession {
  id: string;
  startTime: string; // ISO or "HH:mm"
  endTime?: string;
  durationMinutes: number;
  reason?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string; // "YYYY-MM-DD"
  checkInTime: string | null; // "HH:mm:ss" or ISO
  checkOutTime: string | null; // "HH:mm:ss" or ISO
  breaks: BreakSession[];
  grossHours: number; // in hours (decimal)
  breakHours: number; // in hours (decimal)
  netWorkHours: number; // gross - break
  overtimeHours: number;
  deficitHours: number;
  status: AttendanceStatus;
  workLocation: WorkLocation;
  checkInNotes?: string;
  checkOutNotes?: string;
  isLate: boolean;
  lateMinutes: number;
  isRegularized?: boolean;
}

export interface LeaveBalance {
  casualLeave: number; // standard e.g. 12
  sickLeave: number;   // standard e.g. 8
  privilegeLeave: number; // standard e.g. 15
  lossOfPayDays: number;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface LeaveDeduction {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  reason: '3_LATE_ARRIVALS' | 'HALF_DAY_SHORTFALL' | 'UNEXCUSED_ABSENCE' | 'APPROVED_LEAVE';
  deductedDays: number;
  leaveTypeAffected: LeaveType;
  description: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

export interface Employee {
  id: string; // e.g. "EMP-101"
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: Department;
  designation: string;
  avatarUrl?: string;
  shiftStart: string; // "09:00"
  shiftEnd: string;   // "18:00"
  joiningDate: string;
  leaveBalance: LeaveBalance;
  phone?: string;
}
