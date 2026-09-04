import React from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  EmployeeDashboard 
} from './components/EmployeeDashboard';
import { 
  HrDashboard 
} from './components/HrDashboard';
import { 
  LeaveModal 
} from './components/LeaveModal';
import { 
  RegularizationModal 
} from './components/RegularizationModal';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  AssignmentDocsModal 
} from './components/AssignmentDocsModal';
import { 
  storage 
} from './utils/storage';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveApplication, 
  RegularizationRequest, 
  WorkLocation, 
  LeaveType 
} from './types';
import { 
  calculateAttendanceHours, 
  checkPunctuality,
  timeStringToMinutes
} from './utils/attendanceCalculations';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function App() {
  // Application Data States
  const [currentUser, setCurrentUser] = React.useState<Employee>(() => storage.getCurrentUser());
  const [employees, setEmployees] = React.useState<Employee[]>(() => storage.getEmployees());
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>(() => storage.getAttendance());
  const [leaves, setLeaves] = React.useState<LeaveApplication[]>(() => storage.getLeaves());
  const [regularizations, setRegularizations] = React.useState<RegularizationRequest[]>(() => storage.getRegularizations());

  // Navigation & Modals
  const [activeView, setActiveView] = React.useState<'dashboard' | 'calendar' | 'leaves' | 'deductions'>('dashboard');
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = React.useState(false);
  const [regularizationModalOpen, setRegularizationModalOpen] = React.useState(false);
  const [docsModalOpen, setDocsModalOpen] = React.useState(false);

  // Toast notification
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync states to local storage
  React.useEffect(() => {
    storage.setCurrentUser(currentUser);
  }, [currentUser]);

  React.useEffect(() => {
    storage.setEmployees(employees);
  }, [employees]);

  React.useEffect(() => {
    storage.setAttendance(attendance);
  }, [attendance]);

  React.useEffect(() => {
    storage.setLeaves(leaves);
  }, [leaves]);

  React.useEffect(() => {
    storage.setRegularizations(regularizations);
  }, [regularizations]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's record for current user
  const todayRecord = React.useMemo(() => {
    return attendance.find(r => r.employeeId === currentUser.id && r.date === todayStr) || null;
  }, [attendance, currentUser.id, todayStr]);

  // Current time formatted
  const getNowTimeString = (): string => {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // "HH:mm:ss"
  };

  // 1. PUNCH IN HANDLER
  const handlePunchIn = (location: WorkLocation, notes?: string) => {
    const punchTime = getNowTimeString();
    const punctuality = checkPunctuality(punchTime, currentUser.shiftStart);

    let updatedRecords: AttendanceRecord[];
    const existingIndex = attendance.findIndex(r => r.employeeId === currentUser.id && r.date === todayStr);

    const recordPayload: AttendanceRecord = {
      id: existingIndex >= 0 ? attendance[existingIndex].id : `ATT-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      date: todayStr,
      checkInTime: punchTime,
      checkOutTime: null,
      breaks: [],
      grossHours: 0,
      breakHours: 0,
      netWorkHours: 0,
      overtimeHours: 0,
      deficitHours: 8,
      status: punctuality.isLate ? 'late' : 'present',
      workLocation: location,
      checkInNotes: notes,
      isLate: punctuality.isLate,
      lateMinutes: punctuality.lateMinutes,
    };

    if (existingIndex >= 0) {
      updatedRecords = [...attendance];
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        ...recordPayload,
      };
    } else {
      updatedRecords = [recordPayload, ...attendance];
    }

    setAttendance(updatedRecords);

    if (punctuality.isLate) {
      showToast(
        `Checked in at ${punchTime}. Late arrival recorded (${punctuality.lateMinutes} mins after shift start).`,
        'warning'
      );
    } else {
      showToast(`Punched in successfully at ${punchTime} (${location}). Have a productive day!`, 'success');
    }
  };

  // 2. PUNCH OUT HANDLER
  const handlePunchOut = (notes?: string) => {
    if (!todayRecord || !todayRecord.checkInTime) return;

    const punchOutTime = getNowTimeString();
    const totalBreakMinutes = (todayRecord.breaks || []).reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

    const calculations = calculateAttendanceHours(
      todayRecord.checkInTime,
      punchOutTime,
      totalBreakMinutes,
      currentUser.shiftStart
    );

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      checkOutTime: punchOutTime,
      checkOutNotes: notes,
      ...calculations,
    };

    const updatedList = attendance.map(r => r.id === todayRecord.id ? updatedRecord : r);
    setAttendance(updatedList);

    showToast(
      `Punched out at ${punchOutTime}. Net working hours: ${calculations.netWorkHours}h (Break: ${calculations.breakHours}h).`,
      'success'
    );
  };

  // 3. START BREAK HANDLER
  const handleStartBreak = (reason: string) => {
    if (!todayRecord) return;
    const startTime = getNowTimeString();

    const newBreak = {
      id: `BRK-${Date.now()}`,
      startTime,
      durationMinutes: 0,
      reason,
    };

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      breaks: [...(todayRecord.breaks || []), newBreak],
    };

    setAttendance(attendance.map(r => r.id === todayRecord.id ? updatedRecord : r));
    showToast(`Break started at ${startTime} (${reason}). Work timer paused.`, 'info');
  };

  // 4. END BREAK HANDLER
  const handleEndBreak = () => {
    if (!todayRecord || !todayRecord.breaks) return;
    const endTime = getNowTimeString();

    const breaks = todayRecord.breaks.map(b => {
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

    const totalBreakMins = breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
    const breakHours = Number((totalBreakMins / 60).toFixed(2));

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      breaks,
      breakHours,
    };

    setAttendance(attendance.map(r => r.id === todayRecord.id ? updatedRecord : r));
    showToast(`Break ended at ${endTime}. Resumed productive working hours.`, 'success');
  };

  // 5. APPLY LEAVE HANDLER
  const handleApplyLeave = (data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
  }) => {
    const newLeave: LeaveApplication = {
      id: `LEV-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      ...data,
      status: 'pending',
      appliedOn: todayStr,
    };

    setLeaves([newLeave, ...leaves]);
    showToast(`Leave application for ${data.daysCount} day(s) submitted for HR review.`, 'success');
  };

  // 6. HR APPROVE LEAVE
  const handleApproveLeave = (leaveId: string) => {
    const targetLeave = leaves.find(l => l.id === leaveId);
    if (!targetLeave) return;

    // Update leave application status
    const updatedLeaves = leaves.map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status: 'approved' as const,
          reviewedBy: `${currentUser.name} (HR)`,
          reviewedAt: todayStr,
        };
      }
      return l;
    });
    setLeaves(updatedLeaves);

    // Deduct leave balance from employee
    const updatedEmployees = employees.map(emp => {
      if (emp.id === targetLeave.employeeId) {
        const bal = { ...emp.leaveBalance };
        if (targetLeave.leaveType === 'Casual Leave') {
          bal.casualLeave = Math.max(0, bal.casualLeave - targetLeave.daysCount);
        } else if (targetLeave.leaveType === 'Sick Leave') {
          bal.sickLeave = Math.max(0, bal.sickLeave - targetLeave.daysCount);
        } else if (targetLeave.leaveType === 'Privilege Leave') {
          bal.privilegeLeave = Math.max(0, bal.privilegeLeave - targetLeave.daysCount);
        } else {
          bal.lossOfPayDays += targetLeave.daysCount;
        }
        return {
          ...emp,
          leaveBalance: bal,
        };
      }
      return emp;
    });
    setEmployees(updatedEmployees);

    // Also update current user if it's the current user
    if (currentUser.id === targetLeave.employeeId) {
      const updatedEmp = updatedEmployees.find(e => e.id === currentUser.id);
      if (updatedEmp) setCurrentUser(updatedEmp);
    }

    // Add attendance record marked as 'on_leave' for the leave date(s)
    const leaveRec: AttendanceRecord = {
      id: `ATT-LEV-${Date.now()}`,
      employeeId: targetLeave.employeeId,
      employeeName: targetLeave.employeeName,
      department: targetLeave.department,
      date: targetLeave.startDate,
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
      checkInNotes: `Approved Leave: ${targetLeave.leaveType} (${targetLeave.reason})`,
      isLate: false,
      lateMinutes: 0,
    };
    setAttendance([leaveRec, ...attendance]);

    showToast(`Leave application approved. Deducted ${targetLeave.daysCount} day(s) from ${targetLeave.employeeName}'s quota.`, 'success');
  };

  // 7. HR REJECT LEAVE
  const handleRejectLeave = (leaveId: string, reason?: string) => {
    const updatedLeaves = leaves.map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status: 'rejected' as const,
          reviewedBy: `${currentUser.name} (HR)`,
          reviewedAt: todayStr,
          rejectionReason: reason || 'Business requirements',
        };
      }
      return l;
    });
    setLeaves(updatedLeaves);
    showToast('Leave application marked as rejected.', 'info');
  };

  // 8. APPLY REGULARIZATION
  const handleApplyRegularization = (data: {
    date: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    reason: string;
  }) => {
    const newReg: RegularizationRequest = {
      id: `REG-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      ...data,
      status: 'pending',
      appliedOn: todayStr,
    };

    setRegularizations([newReg, ...regularizations]);
    showToast('Attendance regularization submitted to HR for approval.', 'success');
  };

  // 9. HR APPROVE REGULARIZATION
  const handleApproveRegularization = (regId: string) => {
    const targetReg = regularizations.find(r => r.id === regId);
    if (!targetReg) return;

    // Update request
    const updatedRegs = regularizations.map(r => r.id === regId ? { ...r, status: 'approved' as const } : r);
    setRegularizations(updatedRegs);

    // Update or insert attendance record
    const calculations = calculateAttendanceHours(
      targetReg.requestedCheckIn,
      targetReg.requestedCheckOut,
      0,
      currentUser.shiftStart
    );

    const existingRec = attendance.find(r => r.employeeId === targetReg.employeeId && r.date === targetReg.date);
    if (existingRec) {
      const updatedList = attendance.map(r => r.id === existingRec.id ? {
        ...r,
        checkInTime: targetReg.requestedCheckIn,
        checkOutTime: targetReg.requestedCheckOut,
        isRegularized: true,
        ...calculations,
      } : r);
      setAttendance(updatedList);
    } else {
      const newRec: AttendanceRecord = {
        id: `ATT-REG-${Date.now()}`,
        employeeId: targetReg.employeeId,
        employeeName: targetReg.employeeName,
        department: targetReg.department,
        date: targetReg.date,
        checkInTime: targetReg.requestedCheckIn,
        checkOutTime: targetReg.requestedCheckOut,
        breaks: [],
        isRegularized: true,
        workLocation: 'In-Office',
        checkInNotes: `Regularized: ${targetReg.reason}`,
        ...calculations,
      };
      setAttendance([newRec, ...attendance]);
    }

    showToast(`Regularization approved for ${targetReg.employeeName} on ${targetReg.date}.`, 'success');
  };

  // 10. HR REJECT REGULARIZATION
  const handleRejectRegularization = (regId: string) => {
    const updatedRegs = regularizations.map(r => r.id === regId ? { ...r, status: 'rejected' as const } : r);
    setRegularizations(updatedRegs);
    showToast('Regularization request rejected.', 'info');
  };

  // 11. SWITCH USER (DEMO OR LOGIN)
  const handleSwitchUser = (emp: Employee) => {
    setCurrentUser(emp);
    showToast(`Switched active profile to ${emp.name} (${emp.role === 'hr_admin' ? 'HR Administrator' : 'Staff Employee'}).`, 'info');
  };

  // 12. RESET EVALUATION SEED DATA
  const handleResetData = () => {
    storage.resetAll();
    const freshUser = storage.getCurrentUser();
    setCurrentUser(freshUser);
    setEmployees(storage.getEmployees());
    setAttendance(storage.getAttendance());
    setLeaves(storage.getLeaves());
    setRegularizations(storage.getRegularizations());
    showToast('Database reset to benchmark evaluator dataset.', 'success');
  };

  // 13. REGISTER NEW EMPLOYEE
  const handleRegisterNewEmployee = (newEmp: Employee) => {
    const updatedEmployees = [...employees, newEmp];
    setEmployees(updatedEmployees);
    setCurrentUser(newEmp);
    showToast(`Welcome ${newEmp.name}! Account registered successfully.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        employees={employees}
        onSwitchUser={handleSwitchUser}
        onOpenDocs={() => setDocsModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          showToast('Session logged out. Switched to guest demo.', 'info');
          setAuthModalOpen(true);
        }}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Role Notice & Quick Switcher Pill */}
      <div className="bg-indigo-900 text-indigo-100 text-xs py-2 px-4 border-b border-indigo-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Logged in as <strong>{currentUser.name}</strong> • Role: <strong className="uppercase">{currentUser.role.replace('_', ' ')}</strong> ({currentUser.department})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-indigo-300 hidden sm:inline">Testing evaluator mode:</span>
            {currentUser.role === 'hr_admin' ? (
              <button
                onClick={() => {
                  const dev = employees.find(e => e.role === 'employee') || employees[1];
                  handleSwitchUser(dev);
                }}
                className="px-2.5 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white font-semibold transition-colors cursor-pointer"
              >
                Switch to Employee View (Rahul Sharma)
              </button>
            ) : (
              <button
                onClick={() => {
                  const hr = employees.find(e => e.role === 'hr_admin') || employees[0];
                  handleSwitchUser(hr);
                }}
                className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                Switch to HR Admin View (Sunita Rao)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'hr_admin' ? (
          <HrDashboard
            currentUser={currentUser}
            employees={employees}
            attendanceRecords={attendance}
            leaveApplications={leaves}
            regularizationRequests={regularizations}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
            onApproveRegularization={handleApproveRegularization}
            onRejectRegularization={handleRejectRegularization}
            onOpenDocs={() => setDocsModalOpen(true)}
          />
        ) : (
          <EmployeeDashboard
            currentUser={currentUser}
            todayRecord={todayRecord}
            attendanceHistory={attendance}
            leaveApplications={leaves}
            regularizationRequests={regularizations}
            onPunchIn={handlePunchIn}
            onPunchOut={handlePunchOut}
            onStartBreak={handleStartBreak}
            onEndBreak={handleEndBreak}
            onOpenLeaveModal={() => setLeaveModalOpen(true)}
            onOpenRegularizationModal={() => setRegularizationModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">INNER EYE CONSULTANCY SERVICES LLP</span>
            <span>• Employee Attendance Management System</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDocsModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Assignment Submission Docs & SQL Schema
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset Benchmark Seed Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        currentUser={currentUser}
        onSubmit={handleApplyLeave}
      />

      <RegularizationModal
        isOpen={regularizationModalOpen}
        onClose={() => setRegularizationModalOpen(false)}
        currentUser={currentUser}
        onSubmit={handleApplyRegularization}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={(email) => {
          const found = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
          if (found) {
            handleSwitchUser(found);
            return true;
          }
          return false;
        }}
        onRegister={handleRegisterNewEmployee}
        demoEmployees={employees}
        onSelectDemo={handleSwitchUser}
      />

      <AssignmentDocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        onResetData={handleResetData}
      />

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className={`p-4 rounded-xl shadow-xl border text-xs flex items-start gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
