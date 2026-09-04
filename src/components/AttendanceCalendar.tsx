import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Coffee, 
  X,
  FileText
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  employeeId?: string;
  employeeName?: string;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  records,
  employeeId,
  employeeName,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<AttendanceRecord | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = React.useState(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate days in month and starting weekday
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Map of date string "YYYY-MM-DD" to record
  const recordsMap = React.useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach(rec => {
      if (!employeeId || rec.employeeId === employeeId) {
        map.set(rec.date, rec);
      }
    });
    return map;
  }, [records, employeeId]);

  // Calendar cells
  const daysCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysCells.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-slate-50/50 border border-slate-100 rounded-lg opacity-40"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const record = recordsMap.get(dateStr);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    let cellBadge = null;
    let cellBg = 'bg-white hover:bg-slate-50';

    if (record) {
      if (record.status === 'present') {
        cellBg = 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-emerald-100 text-emerald-800 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Present ({record.netWorkHours}h)
          </span>
        );
      } else if (record.status === 'overtime') {
        cellBg = 'bg-teal-50/80 hover:bg-teal-100/80 border-teal-300';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-teal-100 text-teal-900 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            OT (+{record.overtimeHours}h)
          </span>
        );
      } else if (record.status === 'late') {
        cellBg = 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-amber-100 text-amber-900 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Late ({record.lateMinutes}m)
          </span>
        );
      } else if (record.status === 'half_day') {
        cellBg = 'bg-orange-50/80 hover:bg-orange-100/80 border-orange-200';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-orange-100 text-orange-900 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            Half Day ({record.netWorkHours}h)
          </span>
        );
      } else if (record.status === 'on_leave') {
        cellBg = 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-indigo-100 text-indigo-900 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Leave
          </span>
        );
      } else if (record.status === 'absent') {
        cellBg = 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200';
        cellBadge = (
          <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-rose-100 text-rose-900 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Absent
          </span>
        );
      }
    } else if (isWeekend) {
      cellBg = 'bg-slate-50/60 border-slate-100';
      cellBadge = <span className="text-[10px] text-slate-400 font-medium">Weekend</span>;
    }

    daysCells.push(
      <button
        key={dateStr}
        onClick={() => record && setSelectedDate(record)}
        disabled={!record}
        className={`h-20 sm:h-24 p-2 text-left rounded-xl border transition-all flex flex-col justify-between ${cellBg} ${
          isToday ? 'ring-2 ring-blue-500' : ''
        } ${record ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex justify-between items-center">
          <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
            {day}
          </span>
          {isToday && (
            <span className="text-[9px] font-bold px-1 bg-blue-600 text-white rounded">
              Today
            </span>
          )}
        </div>
        <div className="truncate w-full mt-1">
          {cellBadge}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      
      {/* Month Controls & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Attendance Status Calendar</span>
              {employeeName && (
                <span className="text-xs font-normal text-slate-500">• {employeeName}</span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Visual monthly tracking with status badges and punctuality history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[120px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 my-3 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Present (&gt;=8h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Late Arrival (&gt;09:15)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          Half Day (&lt;4h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
          Overtime (&gt;8.5h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          Approved Leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          Absent
        </span>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysCells}
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Attendance Details • {selectedDate.date}
                </h4>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-800">{selectedDate.employeeName} ({selectedDate.employeeId})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedDate.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Check In:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedDate.checkInTime || '—'}
                  {selectedDate.isLate && (
                    <span className="text-amber-600 font-bold ml-1 text-[11px]">
                      (Late by {selectedDate.lateMinutes} mins)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Check Out:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedDate.checkOutTime || 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Break Duration:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedDate.breakHours} hrs ({selectedDate.breaks?.length || 0} breaks)
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Net Productive Hours:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {selectedDate.netWorkHours} hrs
                </span>
              </div>
              {selectedDate.overtimeHours > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Overtime:</span>
                  <span className="font-mono font-bold text-teal-600">
                    +{selectedDate.overtimeHours} hrs
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Work Location:</span>
                <span className="font-semibold text-slate-700">{selectedDate.workLocation}</span>
              </div>
              {selectedDate.checkInNotes && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                  <span className="font-semibold block text-slate-700">Check-in Note:</span>
                  {selectedDate.checkInNotes}
                </div>
              )}
              {selectedDate.checkOutNotes && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                  <span className="font-semibold block text-slate-700">Day Summary:</span>
                  {selectedDate.checkOutNotes}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
