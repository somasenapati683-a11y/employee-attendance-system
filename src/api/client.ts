import { 
  Employee, 
  AttendanceRecord, 
  LeaveApplication, 
  RegularizationRequest, 
  WorkLocation, 
  LeaveType 
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  // Check health
  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth
  async login(email: string, password?: string): Promise<{ user: Employee; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(data: Partial<Employee>): Promise<{ user: Employee }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  // Employees
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  // Attendance
  async getAttendance(params?: { date?: string; department?: string; employeeId?: string; status?: string }): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.department && params.department !== 'All') query.append('department', params.department);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status && params.status !== 'All') query.append('status', params.status);

    const res = await fetch(`${API_BASE}/attendance?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  async punchIn(employeeId: string, workLocation: WorkLocation, notes?: string): Promise<{ message: string; record: AttendanceRecord }> {
    const res = await fetch(`${API_BASE}/attendance/punch-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, workLocation, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Punch-in failed' }));
      throw new Error(err.error || 'Punch-in failed');
    }
    return res.json();
  },

  async punchOut(employeeId: string, notes?: string): Promise<{ message: string; record: AttendanceRecord }> {
    const res = await fetch(`${API_BASE}/attendance/punch-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Punch-out failed' }));
      throw new Error(err.error || 'Punch-out failed');
    }
    return res.json();
  },

  async startBreak(employeeId: string, reason: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/attendance/break/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start break' }));
      throw new Error(err.error || 'Failed to start break');
    }
    return res.json();
  },

  async endBreak(employeeId: string): Promise<{ message: string; breakHours: number }> {
    const res = await fetch(`${API_BASE}/attendance/break/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to end break' }));
      throw new Error(err.error || 'Failed to end break');
    }
    return res.json();
  },

  // Leaves
  async getLeaves(employeeId?: string): Promise<LeaveApplication[]> {
    const url = employeeId ? `${API_BASE}/leaves?employeeId=${employeeId}` : `${API_BASE}/leaves`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch leaves');
    return res.json();
  },

  async applyLeave(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
  }): Promise<LeaveApplication> {
    const res = await fetch(`${API_BASE}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to apply leave' }));
      throw new Error(err.error || 'Failed to apply leave');
    }
    return res.json();
  },

  async approveLeave(leaveId: string, reviewedBy?: string): Promise<{ message: string; leave: LeaveApplication }> {
    const res = await fetch(`${API_BASE}/leaves/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy }),
    });
    if (!res.ok) throw new Error('Failed to approve leave');
    return res.json();
  },

  async rejectLeave(leaveId: string, reason?: string): Promise<{ message: string; leave: LeaveApplication }> {
    const res = await fetch(`${API_BASE}/leaves/${leaveId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject leave');
    return res.json();
  },

  // Regularizations
  async getRegularizations(): Promise<RegularizationRequest[]> {
    const res = await fetch(`${API_BASE}/regularizations`);
    if (!res.ok) throw new Error('Failed to fetch regularizations');
    return res.json();
  },

  async applyRegularization(data: {
    employeeId: string;
    date: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    reason: string;
  }): Promise<RegularizationRequest> {
    const res = await fetch(`${API_BASE}/regularizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to apply regularization');
    return res.json();
  },

  async approveRegularization(regId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/regularizations/${regId}/approve`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to approve regularization');
    return res.json();
  },

  async rejectRegularization(regId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/regularizations/${regId}/reject`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to reject regularization');
    return res.json();
  },

  // Deductions
  async getDeductions() {
    const res = await fetch(`${API_BASE}/deductions`);
    if (!res.ok) throw new Error('Failed to fetch deductions');
    return res.json();
  },

  // Reset
  async resetData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset backend data');
    return res.json();
  },
};
