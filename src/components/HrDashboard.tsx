import React from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  FileCheck2, 
  Building2, 
  ShieldAlert,
  ArrowDownToLine,
  Sparkles,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveApplication, 
  Department, 
  AttendanceStatus, 
  RegularizationRequest 
} from '../types';
import { computeEmployeeLeaveDeductions, formatDecimalHours } from '../utils/attendanceCalculations';

interface HrDashboardProps {
  currentUser: Employee;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  regularizationRequests: RegularizationRequest[];
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string, reason?: string) => void;
  onApproveRegularization: (regId: string) => void;
  onRejectRegularization: (regId: string) => void;
  onOpenDocs: () => void;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  currentUser,
  employees,
  attendanceRecords,
  leaveApplications,
  regularizationRequests,
  onApproveLeave,
  onRejectLeave,
  onApproveRegularization,
  onRejectRegularization,
  onOpenDocs,
}) => {
  const [activeTab, setActiveTab] = React.useState<'register' | 'presence' | 'leaves' | 'deductions' | 'regularization'>('register');
  
  // Register filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [selectedDept, setSelectedDept] = React.useState<string>('All');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Daily statistics for selected date
  const dateRecords = attendanceRecords.filter(r => r.date === selectedDate);
  const totalEmployeesCount = employees.length;

  const presentCount = dateRecords.filter(r => r.status === 'present' || r.status === 'overtime' || r.status === 'late' || r.status === 'half_day').length;
  const lateCount = dateRecords.filter(r => r.isLate).length;
  const onLeaveCount = dateRecords.filter(r => r.status === 'on_leave').length;
  const absentCount = Math.max(0, totalEmployeesCount - presentCount - onLeaveCount);

  const totalProductiveHoursToday = dateRecords.reduce((acc, r) => acc + (r.netWorkHours || 0), 0);
  const pendingLeavesCount = leaveApplications.filter(l => l.status === 'pending').length;
  const pendingRegularizationsCount = regularizationRequests.filter(r => r.status === 'pending').length;

  // Filtered records for table
  const filteredRecords = React.useMemo(() => {
    return employees.map(emp => {
      const record = dateRecords.find(r => r.employeeId === emp.id);
      return {
        emp,
        record: record || null,
      };
    }).filter(({ emp, record }) => {
      // Dept filter
      if (selectedDept !== 'All' && emp.department !== selectedDept) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(query);
        const matchId = emp.id.toLowerCase().includes(query);
        const matchDept = emp.department.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchDept) return false;
      }
      // Status filter
      if (selectedStatus !== 'All') {
        const currentStatus = record ? record.status : 'absent';
        if (currentStatus !== selectedStatus) return false;
      }
      return true;
    });
  }, [employees, dateRecords, selectedDept, searchQuery, selectedStatus]);

  // Comprehensive company-wide leave deductions calculation
  const companyDeductions = React.useMemo(() => {
    return employees.map(emp => {
      const result = computeEmployeeLeaveDeductions(
        emp.id,
        emp.name,
        attendanceRecords,
        emp.leaveBalance
      );
      return {
        employee: emp,
        ...result,
      };
    });
  }, [employees, attendanceRecords]);

  // Export full attendance sheet to CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Date',
      'Punch In',
      'Punch Out',
      'Gross Hours',
      'Break Hours',
      'Net Productive Hours',
      'Overtime Hours',
      'Status',
      'Late Minutes',
      'Work Location',
    ];

    const rows = filteredRecords.map(({ emp, record }) => [
      emp.id,
      `"${emp.name}"`,
      emp.department,
      selectedDate,
      record?.checkInTime || '—',
      record?.checkOutTime || '—',
      record?.grossHours || 0,
      record?.breakHours || 0,
      record?.netWorkHours || 0,
      record?.overtimeHours || 0,
      record?.status || 'absent',
      record?.lateMinutes || 0,
      record?.workLocation || '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InnerEye_Attendance_Sheet_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HR Executive Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                HR Management Hub
              </span>
              <span className="text-xs text-blue-200">
                Inner Eye Consultancy Services LLP
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Human Resources Administration
            </h1>
            <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
              Enterprise attendance monitoring, automated leave deductions, punctuality audits & approval center.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={onOpenDocs}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Assignment Spec & SQL Scripts</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Export Daily Register (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Workforce
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalEmployeesCount}
          </div>
          <span className="text-[10px] text-slate-500">Active Staff</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Present Today
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {presentCount}
          </div>
          <span className="text-[10px] text-slate-500">
            {Math.round((presentCount / totalEmployeesCount) * 100)}% attendance
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Late Arrivals
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {lateCount}
          </div>
          <span className="text-[10px] text-slate-500">&gt; 09:15 AM threshold</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
            Approved Leave
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
            {onLeaveCount}
          </div>
          <span className="text-[10px] text-slate-500">Formal applications</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
            Absent / Unmarked
          </span>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {absentCount}
          </div>
          <span className="text-[10px] text-slate-500">Subject to LOP rule</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Productive Hours
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {totalProductiveHoursToday.toFixed(1)}h
          </div>
          <span className="text-[10px] text-slate-500">Company net today</span>
        </div>

      </div>

      {/* Main Tabbed Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50 text-xs font-semibold gap-2 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('register')}
            className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab('presence')}
            className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'presence'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Live Workforce Presence</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'leaves'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Leave Approvals Hub</span>
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deductions')}
            className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'deductions'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Leave Deduction Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('regularization')}
            className={`py-3.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'regularization'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Regularization Queue</span>
            {pendingRegularizationsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                {pendingRegularizationsCount}
              </span>
            )}
          </button>

        </div>

        <div className="p-5 sm:p-6">
          
          {/* TAB 1: DAILY ATTENDANCE REGISTER */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              
              {/* Filter controls toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Attendance Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="present">Present (On-time)</option>
                    <option value="late">Late Arrival</option>
                    <option value="overtime">Overtime (&gt;8.5h)</option>
                    <option value="half_day">Half Day (&lt;4h)</option>
                    <option value="on_leave">Approved Leave</option>
                    <option value="absent">Absent / Unmarked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Search Staff
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Name, ID, keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Punch In</th>
                      <th className="py-2.5 px-3">Punch Out</th>
                      <th className="py-2.5 px-3">Gross</th>
                      <th className="py-2.5 px-3">Break</th>
                      <th className="py-2.5 px-3">Net Work</th>
                      <th className="py-2.5 px-3">Overtime</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-400">
                          No matching records for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map(({ emp, record }) => {
                        const isLate = record?.isLate;
                        const status = record ? record.status : 'absent';
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{emp.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{emp.department}</td>
                            <td className="py-2.5 px-3 font-mono font-medium">
                              {record?.checkInTime || '—'}
                              {isLate && (
                                <span className="block text-[10px] font-bold text-amber-600">
                                  Late ({record?.lateMinutes}m)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium">
                              {record?.checkOutTime || (record?.checkInTime ? 'Active' : '—')}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {record ? `${record.grossHours}h` : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {record ? `${record.breakHours}h` : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {record ? `${record.netWorkHours}h` : '0h'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-teal-600">
                              {record && record.overtimeHours > 0 ? `+${record.overtimeHours}h` : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'overtime'
                                  ? 'bg-teal-100 text-teal-900'
                                  : status === 'late'
                                  ? 'bg-amber-100 text-amber-900'
                                  : status === 'half_day'
                                  ? 'bg-orange-100 text-orange-900'
                                  : status === 'on_leave'
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}>
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {record?.workLocation || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE PRESENCE */}
          {activeTab === 'presence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Real-time Workplace Activity Feed
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Shift: 09:00 - 18:00
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {employees.map((emp) => {
                  const todayRec = dateRecords.find(r => r.employeeId === emp.id);
                  const isCheckedIn = Boolean(todayRec?.checkInTime && !todayRec?.checkOutTime);
                  const isCheckedOut = Boolean(todayRec?.checkOutTime);
                  const onBreak = todayRec?.breaks?.some(b => !b.endTime);

                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCheckedIn && !onBreak
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : onBreak
                          ? 'bg-amber-50/40 border-amber-200'
                          : isCheckedOut
                          ? 'bg-blue-50/40 border-blue-200'
                          : todayRec?.status === 'on_leave'
                          ? 'bg-indigo-50/40 border-indigo-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {emp.name}
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              ({emp.id})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {emp.designation} • {emp.department}
                          </div>
                        </div>

                        {isCheckedIn && !onBreak && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                            Active
                          </span>
                        )}
                        {onBreak && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            On Break
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Completed
                          </span>
                        )}
                        {todayRec?.status === 'on_leave' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            On Leave
                          </span>
                        )}
                        {!todayRec && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            Not Marked
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600 flex justify-between items-center">
                        <span>Punch In: <strong>{todayRec?.checkInTime || '—'}</strong></span>
                        <span>Mode: <strong>{todayRec?.workLocation || '—'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE APPROVALS HUB */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Pending Leave Applications & Approvals
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review staff requests with automated balance deduction on approval.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  {pendingLeavesCount} Action Items Required
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Applicant</th>
                      <th className="py-2.5 px-3">Leave Type</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Days</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Current Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {leaveApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          No leave applications logged in system.
                        </td>
                      </tr>
                    ) : (
                      leaveApplications.map((lev) => {
                        const applicant = employees.find(e => e.id === lev.employeeId);
                        const isPending = lev.status === 'pending';
                        return (
                          <tr key={lev.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{lev.employeeName}</div>
                              <div className="text-[10px] text-slate-400">{lev.department} • {lev.employeeId}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-indigo-700">{lev.leaveType}</td>
                            <td className="py-3 px-3">
                              {lev.startDate} to {lev.endDate}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold">{lev.daysCount}</td>
                            <td className="py-3 px-3 max-w-[220px] text-slate-600">
                              {lev.reason}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                              {applicant ? (
                                <span>
                                  CL: {applicant.leaveBalance.casualLeave}d | SL: {applicant.leaveBalance.sickLeave}d
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-3 px-3">
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
                            <td className="py-3 px-3 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onApproveLeave(lev.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => onRejectLeave(lev.id, 'Project deliverables deadline')}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Processed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATED LEAVE DEDUCTIONS & PAYROLL IMPACT */}
          {activeTab === 'deductions' && (
            <div className="space-y-6">
              
              {/* Policy Explanation Banner */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Automated Leave Deduction Engine Policy Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-amber-800 pt-1">
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900 mb-0.5">Policy 1: 3 Late Arrivals</span>
                    3 check-ins after 09:15 AM in a month triggers an automated <strong>0.5 day deduction</strong> from Casual Leave (or LOP if exhausted).
                  </div>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900 mb-0.5">Policy 2: Half-Day Shortfall</span>
                    Net working hours between 0.1h and 3.99h automatically marks <strong>Half Day</strong> and deducts <strong>0.5 day leave</strong>.
                  </div>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900 mb-0.5">Policy 3: Unexcused Absence</span>
                    Absence on a scheduled workday without approved leave deducts <strong>1.0 day Loss of Pay (LOP)</strong>.
                  </div>
                </div>
              </div>

              {/* Employee-by-Employee Deductions Report */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Monthly Leave Deductions & Payroll Impact Audit
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Automatically evaluated from punch clock data
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Late Count</th>
                        <th className="py-2.5 px-3">Half-Day Count</th>
                        <th className="py-2.5 px-3">Unexcused Absent</th>
                        <th className="py-2.5 px-3">Total Deductions</th>
                        <th className="py-2.5 px-3">Remaining Casual Leave</th>
                        <th className="py-2.5 px-3">Accumulated LOP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {companyDeductions.map(({ employee, deductions, lateArrivalCount, halfDayCount, absentCount, updatedBalance }) => {
                        const totalDeductedDays = deductions.reduce((acc, d) => acc + d.deductedDays, 0);
                        return (
                          <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{employee.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{employee.id}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{employee.department}</td>
                            <td className="py-3 px-3 font-mono">
                              {lateArrivalCount > 0 ? (
                                <span className={lateArrivalCount >= 3 ? 'text-amber-700 font-bold' : ''}>
                                  {lateArrivalCount} {lateArrivalCount >= 3 && '⚠️ (Penalty applied)'}
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {halfDayCount > 0 ? (
                                <span className="text-orange-700 font-bold">{halfDayCount}</span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {absentCount > 0 ? (
                                <span className="text-rose-700 font-bold">{absentCount}</span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold">
                              {totalDeductedDays > 0 ? (
                                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                  -{totalDeductedDays} days
                                </span>
                              ) : (
                                <span className="text-emerald-700">0 days</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-800">
                              {updatedBalance.casualLeave} days
                            </td>
                            <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                              {updatedBalance.lossOfPayDays > 0 ? `${updatedBalance.lossOfPayDays} days` : '0 days'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: REGULARIZATION QUEUE */}
          {activeTab === 'regularization' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Attendance Regularization Requests
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and approve employee requests to correct missed check-ins due to device failure or off-site duty.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                  {pendingRegularizationsCount} Pending
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Requested In</th>
                      <th className="py-2.5 px-3">Requested Out</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {regularizationRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No regularization requests in queue.
                        </td>
                      </tr>
                    ) : (
                      regularizationRequests.map((reg) => {
                        const isPending = reg.status === 'pending';
                        return (
                          <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{reg.employeeName}</div>
                              <div className="text-[10px] text-slate-400">{reg.department} • {reg.employeeId}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold">{reg.date}</td>
                            <td className="py-3 px-3 font-mono">{reg.requestedCheckIn}</td>
                            <td className="py-3 px-3 font-mono">{reg.requestedCheckOut}</td>
                            <td className="py-3 px-3 text-slate-600 max-w-[200px]">{reg.reason}</td>
                            <td className="py-3 px-3">
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
                            <td className="py-3 px-3 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onApproveRegularization(reg.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Rectify</span>
                                  </button>
                                  <button
                                    onClick={() => onRejectRegularization(reg.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Processed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
