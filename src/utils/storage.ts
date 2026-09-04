import { Employee, AttendanceRecord, LeaveApplication, RegularizationRequest } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE, INITIAL_LEAVE_APPLICATIONS, INITIAL_REGULARIZATIONS } from '../data/initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'innereye_current_user',
  EMPLOYEES: 'innereye_employees',
  ATTENDANCE: 'innereye_attendance',
  LEAVES: 'innereye_leaves',
  REGULARIZATIONS: 'innereye_regularizations',
};

export const storage = {
  getCurrentUser(): Employee {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    // Default to HR Manager (Sunita Rao) or first employee
    return INITIAL_EMPLOYEES[0];
  },

  setCurrentUser(user: Employee | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getEmployees(): Employee[] {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse employees', e);
      }
    }
    return INITIAL_EMPLOYEES;
  },

  setEmployees(employees: Employee[]): void {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getAttendance(): AttendanceRecord[] {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse attendance', e);
      }
    }
    return INITIAL_ATTENDANCE;
  },

  setAttendance(records: AttendanceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getLeaves(): LeaveApplication[] {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse leaves', e);
      }
    }
    return INITIAL_LEAVE_APPLICATIONS;
  },

  setLeaves(leaves: LeaveApplication[]): void {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  },

  getRegularizations(): RegularizationRequest[] {
    const saved = localStorage.getItem(STORAGE_KEYS.REGULARIZATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse regularizations', e);
      }
    }
    return INITIAL_REGULARIZATIONS;
  },

  setRegularizations(regs: RegularizationRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.REGULARIZATIONS, JSON.stringify(regs));
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.LEAVES);
    localStorage.removeItem(STORAGE_KEYS.REGULARIZATIONS);
  }
};
