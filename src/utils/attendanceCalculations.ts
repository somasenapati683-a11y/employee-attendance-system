import { AttendanceRecord, AttendanceStatus, LeaveBalance, LeaveDeduction } from '../types';

export const STANDARD_HOURS_PER_DAY = 8.0;
export const STANDARD_SHIFT_START = '09:00';
export const STANDARD_SHIFT_END = '18:00';
export const LATE_GRACE_MINUTES = 15; // check-in after 09:15 is considered Late

/**
 * Parses "HH:mm" or "HH:mm:ss" into total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Handle ISO string or simple HH:mm:ss
  let cleanTime = timeStr;
  if (timeStr.includes('T')) {
    cleanTime = timeStr.split('T')[1].substring(0, 8);
  }
  const parts = cleanTime.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats minutes into "Xh Ym"
 */
export function formatMinutesToHoursMins(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h 0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats decimal hours (e.g. 8.5) to "8h 30m"
 */
export function formatDecimalHours(hours: number): string {
  if (!hours || hours <= 0) return '0h 0m';
  const totalMinutes = Math.round(hours * 60);
  return formatMinutesToHoursMins(totalMinutes);
}

/**
 * Evaluates whether a check-in time is late compared to standard shift start
 */
export function checkPunctuality(checkInTime: string, shiftStart: string = STANDARD_SHIFT_START): { isLate: boolean; lateMinutes: number } {
  if (!checkInTime) return { isLate: false, lateMinutes: 0 };
  
  const checkInMin = timeStringToMinutes(checkInTime);
  const shiftStartMin = timeStringToMinutes(shiftStart);
  const thresholdMin = shiftStartMin + LATE_GRACE_MINUTES;

  if (checkInMin > thresholdMin) {
    return {
      isLate: true,
      lateMinutes: checkInMin - shiftStartMin,
    };
  }
  return { isLate: false, lateMinutes: 0 };
}

/**
 * Calculates working hours, overtime, deficit, and status
 */
export function calculateAttendanceHours(
  checkInTime: string | null,
  checkOutTime: string | null,
  totalBreakMinutes: number = 0,
  shiftStart: string = STANDARD_SHIFT_START
): {
  grossHours: number;
  breakHours: number;
  netWorkHours: number;
  overtimeHours: number;
  deficitHours: number;
  status: AttendanceStatus;
  isLate: boolean;
  lateMinutes: number;
} {
  if (!checkInTime) {
    return {
      grossHours: 0,
      breakHours: 0,
      netWorkHours: 0,
      overtimeHours: 0,
      deficitHours: STANDARD_HOURS_PER_DAY,
      status: 'absent',
      isLate: false,
      lateMinutes: 0,
    };
  }

  const { isLate, lateMinutes } = checkPunctuality(checkInTime, shiftStart);

  // If currently checked in without checkout time
  if (!checkOutTime) {
    return {
      grossHours: 0,
      breakHours: Number((totalBreakMinutes / 60).toFixed(2)),
      netWorkHours: 0,
      overtimeHours: 0,
      deficitHours: 0,
      status: isLate ? 'late' : 'present',
      isLate,
      lateMinutes,
    };
  }

  const checkInMin = timeStringToMinutes(checkInTime);
  const checkOutMin = timeStringToMinutes(checkOutTime);
  let diffMinutes = checkOutMin - checkInMin;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // wrap over midnight
  }

  const grossHours = Number((diffMinutes / 60).toFixed(2));
  const breakHours = Number((totalBreakMinutes / 60).toFixed(2));
  const netWorkHours = Math.max(0, Number((grossHours - breakHours).toFixed(2)));

  let overtimeHours = 0;
  let deficitHours = 0;
  let status: AttendanceStatus = isLate ? 'late' : 'present';

  if (netWorkHours >= STANDARD_HOURS_PER_DAY) {
    overtimeHours = Number((netWorkHours - STANDARD_HOURS_PER_DAY).toFixed(2));
    if (overtimeHours >= 0.5) {
      status = 'overtime';
    }
  } else if (netWorkHours > 0 && netWorkHours < 4.0) {
    // Less than 4 hours is considered Half Day
    status = 'half_day';
    deficitHours = Number((STANDARD_HOURS_PER_DAY - netWorkHours).toFixed(2));
  } else {
    deficitHours = Number((STANDARD_HOURS_PER_DAY - netWorkHours).toFixed(2));
  }

  return {
    grossHours,
    breakHours,
    netWorkHours,
    overtimeHours,
    deficitHours,
    status,
    isLate,
    lateMinutes,
  };
}

/**
 * Evaluates automated leave deductions for an employee in a given month.
 * Policies:
 * 1. 3 Late Arrivals in a month -> 0.5 Day Casual Leave deduction
 * 2. Half-Day work (<4 hrs) -> 0.5 Day deduction
 * 3. Unexcused absence -> 1.0 Day Loss of Pay
 */
export function computeEmployeeLeaveDeductions(
  employeeId: string,
  employeeName: string,
  records: AttendanceRecord[],
  currentBalance: LeaveBalance
): {
  deductions: LeaveDeduction[];
  lateArrivalCount: number;
  halfDayCount: number;
  absentCount: number;
  updatedBalance: LeaveBalance;
} {
  const empRecords = records.filter(r => r.employeeId === employeeId);
  const deductions: LeaveDeduction[] = [];

  let lateArrivalCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;

  empRecords.forEach(rec => {
    if (rec.isLate) {
      lateArrivalCount += 1;
    }
    if (rec.status === 'half_day') {
      halfDayCount += 1;
      deductions.push({
        id: `DED-HD-${rec.id}`,
        employeeId,
        employeeName,
        date: rec.date,
        reason: 'HALF_DAY_SHORTFALL',
        deductedDays: 0.5,
        leaveTypeAffected: currentBalance.casualLeave >= 0.5 ? 'Casual Leave' : 'Loss of Pay',
        description: `Worked ${rec.netWorkHours} hrs (< 4.0 hrs threshold). Auto 0.5 day deduction.`,
      });
    } else if (rec.status === 'absent') {
      absentCount += 1;
      deductions.push({
        id: `DED-ABS-${rec.id}`,
        employeeId,
        employeeName,
        date: rec.date,
        reason: 'UNEXCUSED_ABSENCE',
        deductedDays: 1.0,
        leaveTypeAffected: 'Loss of Pay',
        description: `No attendance marked and no approved leave recorded. 1 day Loss of Pay.`,
      });
    }
  });

  // Policy: 3 Late Check-ins = 0.5 Day Casual Leave Deduction
  const latePenaltyTriplets = Math.floor(lateArrivalCount / 3);
  if (latePenaltyTriplets > 0) {
    const penaltyDays = latePenaltyTriplets * 0.5;
    deductions.push({
      id: `DED-LATE-${employeeId}`,
      employeeId,
      employeeName,
      date: new Date().toISOString().split('T')[0],
      reason: '3_LATE_ARRIVALS',
      deductedDays: penaltyDays,
      leaveTypeAffected: currentBalance.casualLeave >= penaltyDays ? 'Casual Leave' : 'Loss of Pay',
      description: `${lateArrivalCount} late arrivals recorded this month (${latePenaltyTriplets}x penalty rule: 3 late = 0.5 day).`,
    });
  }

  // Calculate updated balance
  let casualDeducted = 0;
  let lopAdded = 0;

  deductions.forEach(d => {
    if (d.leaveTypeAffected === 'Casual Leave') {
      casualDeducted += d.deductedDays;
    } else {
      lopAdded += d.deductedDays;
    }
  });

  const updatedBalance: LeaveBalance = {
    ...currentBalance,
    casualLeave: Math.max(0, currentBalance.casualLeave - casualDeducted),
    lossOfPayDays: currentBalance.lossOfPayDays + lopAdded,
  };

  return {
    deductions,
    lateArrivalCount,
    halfDayCount,
    absentCount,
    updatedBalance,
  };
}
