import React from 'react';
import { 
  Clock, 
  Calendar, 
  Award, 
  AlertTriangle, 
  PlusCircle, 
  FileCheck2, 
  CheckCircle2, 
  Briefcase, 
  ArrowUpRight,
  ShieldCheck,
  Coffee,
  Download
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveApplication, WorkLocation, RegularizationRequest } from '../types';
import { PunchCard } from './PunchCard';
import { AttendanceCalendar } from './AttendanceCalendar';
import { formatDecimalHours, computeEmployeeLeaveDeductions } from '../utils/attendanceCalculations';

interface EmployeeDashboardProps {
  currentUser: Employee;
  todayRecord: AttendanceRecord | null;
  attendanceHistory: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  regularizationRequests: RegularizationRequest[];
  onPunchIn: (location: WorkLocation, notes?: string) => void;
  onPunchOut: (notes?: string) => void;
  onStartBreak: (reason: string) => void;
  onEndBreak: () => void;
  onOpenLeaveModal: () => void;
  onOpenRegularizationModal: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  todayRecord,
  attendanceHistory,
  leaveApplications,
  regularizationRequests,
  onPunchIn,
  onPunchOut,
  onStartBreak,
  onEndBreak,
  onOpenLeaveModal,
  onOpenRegularizationModal,
}) => {
  const [activeTab, setActiveTab] = React.useState<'calendar' | 'history' | 'leaves'>('calendar');

  // Filter records for this employee
  const myRecords = React.useMemo(() => {
    return attendanceHistory.filter(r => r.employeeId === currentUser.id);
  }, [attendanceHistory, currentUser.id]);

  // Aggregate metrics for current month
  const metrics = React.useMemo(() => {
    let totalProductiveHours = 0;
    let totalOvertimeHours = 0;
    let lateCount = 0;
    let presentDays = 0;

    myRecords.forEach(r => {
      totalProductiveHours += r.netWorkHours || 0;
      totalOvertimeHours += r.overtimeHours || 0;
      if (r.isLate) lateCount += 1;
      if (r.status === 'present' || r.status === 'overtime') presentDays += 1;
    });

    const punctualityRate = myRecords.length > 0 
      ? Math.round(((myRecords.length - lateCount) / myRecords.length) * 100) 
      : 100;

    return {
      totalProductiveHours: Number(totalProductiveHours.toFixed(1)),
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
      lateCount,
      presentDays,
      punctualityRate,
    };
  }, [myRecords]);

  // Automated leave deductions calculation
  const { deductions } = React.useMemo(() => {
    return computeEmployeeLeaveDeductions(
      currentUser.id,
      currentUser.name,
      myRecords,
      currentUser.leaveBalance
    );
  }, [currentUser, myRecords]);

  // Download personal attendance CSV
  const handleExportMyCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Break (hrs)', 'Net Work (hrs)', 'Overtime (hrs)', 'Status', 'Location', 'Notes'];
    const rows = myRecords.map(r => [
      r.date,
      r.checkInTime || '',
      r.checkOutTime || '',
      r.breakHours || 0,
      r.netWorkHours || 0,
      r.overtimeHours || 0,
      r.status,
      r.workLocation,
      `"${(r.checkInNotes || r.checkOutNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentUser.name.replace(/\s+/g, '_')}_Attendance_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const myLeaves = leaveApplications.filter(l => l.employeeId === currentUser.id);
  const myRegularizations = regularizationRequests.filter(r => r.employeeId === currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10">
                Staff Portal • {currentUser.department}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {currentUser.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {currentUser.designation} • Shift: {currentUser.shiftStart} - {currentUser.shiftEnd}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              id="btn-apply-leave"
              onClick={onOpenLeaveModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
            <button
              id="btn-request-regularization"
              onClick={onOpenRegularizationModal}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Regularize Punch</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Productive Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Productive Hours</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.totalProductiveHours}h
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard: 8h/day • {metrics.presentDays} days worked
          </p>
        </div>

        {/* Card 2: Overtime Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Overtime Accrued</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            +{metrics.totalOvertimeHours}h
          </div>
          <p className="text-[11px] text-teal-600 mt-1">
            Eligible for compensatory credit
          </p>
        </div>

        {/* Card 3: Punctuality */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Punctuality Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.punctualityRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.lateCount} late arrival{metrics.lateCount === 1 ? '' : 's'} recorded
          </p>
        </div>

        {/* Card 4: Deductions / Policy Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Leave Deductions</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800">
            {deductions.reduce((acc, d) => acc + d.deductedDays, 0)} days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {deductions.length} policy deduction event{deductions.length === 1 ? '' : 's'}
          </p>
        </div>

      </div>

      {/* Main interactive section: Punch console & Leave Quota side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Punch In / Out Console (Span 2) */}
        <div className="lg:col-span-2">
          <PunchCard
            currentUser={currentUser}
            todayRecord={todayRecord}
            onPunchIn={onPunchIn}
            onPunchOut={onPunchOut}
            onStartBreak={onStartBreak}
            onEndBreak={onEndBreak}
          />
        </div>

        {/* Leave Quota Balances Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>My Leave Quota</span>
              </h3>
              <button
                onClick={onOpenLeaveModal}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="space-y-3.5">
              
              {/* Casual Leave */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Casual Leave (CL)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentUser.leaveBalance.casualLeave} / 12 days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (currentUser.leaveBalance.casualLeave / 12) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Sick Leave */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Sick Leave (SL)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentUser.leaveBalance.sickLeave} / 8 days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, (currentUser.leaveBalance.sickLeave / 8) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Privilege Leave */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Privilege Leave (PL)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentUser.leaveBalance.privilegeLeave} / 15 days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, (currentUser.leaveBalance.privilegeLeave / 15) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Loss of Pay */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-800">Loss of Pay (LOP)</span>
                  <span className="font-mono font-bold text-rose-700">
                    {currentUser.leaveBalance.lossOfPayDays} days
                  </span>
                </div>
                <p className="text-[10px] text-rose-600 mt-1">
                  Accrues from unexcused absence or exhausted balances
                </p>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Leave Deduction Rule: </span>
            Every 3 late arrivals automatically deducts 0.5 day from Casual Leave.
          </div>
        </div>

      </div>

      {/* Tabs for Calendar vs History vs My Leaves */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex text-xs font-semibold gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Status Calendar View</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Punch History Logs ({myRecords.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'leaves'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>My Requests ({myLeaves.length + myRegularizations.length})</span>
            </button>
          </div>

          {activeTab === 'history' && (
            <button
              onClick={handleExportMyCSV}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'calendar' && (
            <AttendanceCalendar
              records={attendanceHistory}
              employeeId={currentUser.id}
              employeeName={currentUser.name}
            />
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Punch In</th>
                    <th className="py-2.5 px-3">Punch Out</th>
                    <th className="py-2.5 px-3">Break</th>
                    <th className="py-2.5 px-3">Net Work</th>
                    <th className="py-2.5 px-3">Overtime</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        No attendance records logged yet.
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.date}</td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {r.checkInTime || '—'}
                          {r.isLate && (
                            <span className="block text-[10px] text-amber-600 font-bold">
                              Late ({r.lateMinutes}m)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">{r.checkOutTime || '—'}</td>
                        <td className="py-2.5 px-3 font-mono">{r.breakHours}h</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.netWorkHours}h</td>
                        <td className="py-2.5 px-3 font-mono text-teal-600">
                          {r.overtimeHours > 0 ? `+${r.overtimeHours}h` : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'overtime'
                              ? 'bg-teal-100 text-teal-900'
                              : r.status === 'late'
                              ? 'bg-amber-100 text-amber-900'
                              : r.status === 'half_day'
                              ? 'bg-orange-100 text-orange-900'
                              : r.status === 'on_leave'
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{r.workLocation}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate" title={r.checkInNotes || r.checkOutNotes}>
                          {r.checkInNotes || r.checkOutNotes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-6">
              
              {/* Leave requests list */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  My Leave Applications
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Application ID</th>
                        <th className="py-2 px-3">Leave Type</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3">Days</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            No leave applications submitted.
                          </td>
                        </tr>
                      ) : (
                        myLeaves.map((lev) => (
                          <tr key={lev.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-500">{lev.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{lev.leaveType}</td>
                            <td className="py-2.5 px-3">{lev.startDate} to {lev.endDate}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">{lev.daysCount}</td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">{lev.reason}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                lev.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : lev.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {lev.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Regularizations list */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  My Attendance Regularization Requests
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Requested In</th>
                        <th className="py-2 px-3">Requested Out</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myRegularizations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            No regularization requests pending.
                          </td>
                        </tr>
                      ) : (
                        myRegularizations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{reg.date}</td>
                            <td className="py-2.5 px-3 font-mono">{reg.requestedCheckIn}</td>
                            <td className="py-2.5 px-3 font-mono">{reg.requestedCheckOut}</td>
                            <td className="py-2.5 px-3 text-slate-600">{reg.reason}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                reg.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : reg.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {reg.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
