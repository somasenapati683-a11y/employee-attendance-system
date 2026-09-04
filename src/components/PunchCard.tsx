import React from 'react';
import { 
  LogIn, 
  LogOut, 
  Coffee, 
  Play, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Timer,
  Sparkles,
  Info
} from 'lucide-react';
import { AttendanceRecord, Employee, WorkLocation } from '../types';
import { 
  checkPunctuality, 
  calculateAttendanceHours, 
  formatDecimalHours,
  STANDARD_SHIFT_START,
  STANDARD_SHIFT_END
} from '../utils/attendanceCalculations';

interface PunchCardProps {
  currentUser: Employee;
  todayRecord: AttendanceRecord | null;
  onPunchIn: (location: WorkLocation, notes?: string) => void;
  onPunchOut: (notes?: string) => void;
  onStartBreak: (reason: string) => void;
  onEndBreak: () => void;
}

export const PunchCard: React.FC<PunchCardProps> = ({
  currentUser,
  todayRecord,
  onPunchIn,
  onPunchOut,
  onStartBreak,
  onEndBreak,
}) => {
  const [workLocation, setWorkLocation] = React.useState<WorkLocation>('In-Office');
  const [checkInNotes, setCheckInNotes] = React.useState('');
  const [checkOutNotes, setCheckOutNotes] = React.useState('');
  const [breakReason, setBreakReason] = React.useState('Lunch Break');
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Live timer for elapsed work duration
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = Boolean(todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkOutTime);
  const currentActiveBreak = todayRecord?.breaks?.find(b => !b.endTime);
  const isOnBreak = Boolean(currentActiveBreak);

  // Compute live elapsed working seconds
  let liveSecondsWorked = 0;
  if (isCheckedIn && todayRecord?.checkInTime) {
    const [h, m, s] = todayRecord.checkInTime.split(':').map(Number);
    const checkInDate = new Date();
    checkInDate.setHours(h || 0, m || 0, s || 0, 0);

    const diffMs = Math.max(0, currentTime.getTime() - checkInDate.getTime());
    let totalSecs = Math.floor(diffMs / 1000);

    // subtract completed breaks
    const completedBreaksSecs = (todayRecord.breaks || [])
      .filter(b => b.endTime)
      .reduce((acc, b) => acc + (b.durationMinutes * 60), 0);

    // subtract current ongoing break
    if (isOnBreak && currentActiveBreak?.startTime) {
      const [bh, bm, bs] = currentActiveBreak.startTime.split(':').map(Number);
      const bDate = new Date();
      bDate.setHours(bh || 0, bm || 0, bs || 0, 0);
      const currentBreakSecs = Math.max(0, Math.floor((currentTime.getTime() - bDate.getTime()) / 1000));
      totalSecs = Math.max(0, totalSecs - (completedBreaksSecs + currentBreakSecs));
    } else {
      totalSecs = Math.max(0, totalSecs - completedBreaksSecs);
    }
    liveSecondsWorked = totalSecs;
  } else if (isCheckedOut && todayRecord) {
    liveSecondsWorked = Math.round(todayRecord.netWorkHours * 3600);
  }

  const liveHours = Math.floor(liveSecondsWorked / 3600);
  const liveMins = Math.floor((liveSecondsWorked % 3600) / 60);
  const liveSecs = liveSecondsWorked % 60;
  const timerDisplay = `${String(liveHours).padStart(2, '0')}:${String(liveMins).padStart(2, '0')}:${String(liveSecs).padStart(2, '0')}`;

  const handlePunchInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPunchIn(workLocation, checkInNotes);
    setCheckInNotes('');
  };

  const handlePunchOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPunchOut(checkOutNotes);
    setCheckOutNotes('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      
      {/* Header with status pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Attendance Console</h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Shift: {currentUser.shiftStart || STANDARD_SHIFT_START} - {currentUser.shiftEnd || STANDARD_SHIFT_END}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record your daily punch-in, tea/lunch breaks, and daily accomplishment logs.
          </p>
        </div>

        <div>
          {!isCheckedIn && !isCheckedOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Not Checked In
            </span>
          )}

          {isCheckedIn && !isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Checked In • Working
            </span>
          )}

          {isCheckedIn && isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              On Break ({currentActiveBreak?.reason || 'Pause'})
            </span>
          )}

          {isCheckedOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Day Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Counter & Clock Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 items-center">
        
        {/* Real-time Productive Hours counter */}
        <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-inner">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Net Productive Time Today
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                {timerDisplay}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-slate-500 gap-1">
            <div className="flex items-center gap-1.5">
              <span>Standard Goal:</span>
              <span className="font-semibold text-slate-700">8.0 hrs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Break Taken:</span>
              <span className="font-semibold text-slate-700">
                {todayRecord ? `${todayRecord.breakHours || 0} hrs` : '0 hrs'}
              </span>
            </div>
            {todayRecord?.overtimeHours ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span>Overtime:</span>
                <span>+{formatDecimalHours(todayRecord.overtimeHours)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Check-In / Out Times info block */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Punch In:</span>
            <span className="font-mono font-bold text-slate-800">
              {todayRecord?.checkInTime || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Punch Out:</span>
            <span className="font-mono font-bold text-slate-800">
              {todayRecord?.checkOutTime || (isCheckedIn ? 'Active...' : '—')}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Location:</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {todayRecord?.workLocation || workLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Punctuality Alert Notice */}
      {todayRecord?.isLate && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Late Arrival Flagged: </span>
            Punched in at {todayRecord.checkInTime} ({todayRecord.lateMinutes} mins after shift start).
            <p className="text-amber-700 mt-0.5">
              <span className="font-semibold">Company Leave Policy: </span>
              Grace period is 15 minutes. 3 cumulative late arrivals in a calendar month results in a 0.5-day deduction from Casual Leave.
            </p>
          </div>
        </div>
      )}

      {/* Primary Actions based on current status */}
      <div className="space-y-4">
        
        {/* CASE 1: Not checked in yet */}
        {!isCheckedIn && !isCheckedOut && (
          <form onSubmit={handlePunchInSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Working Location / Mode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['In-Office', 'Remote (WFH)', 'Client Site'] as WorkLocation[]).map((loc) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setWorkLocation(loc)}
                      className={`px-2 py-2 text-center rounded-lg border font-medium transition-all ${
                        workLocation === loc
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {loc.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Check-In Note (Optional Standup Task)
                </label>
                <input
                  type="text"
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  placeholder="e.g. Client sprint demo, UI redesign"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="btn-punch-in"
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              <span>Punch In for Today</span>
            </button>
          </form>
        )}

        {/* CASE 2: Checked In - Options to Break or Punch Out */}
        {isCheckedIn && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Need a break?</span>
                <select
                  value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)}
                  disabled={isOnBreak}
                  className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="Lunch Break">Lunch Break (45-60 mins)</option>
                  <option value="Tea / Coffee Break">Tea / Coffee Break (15 mins)</option>
                  <option value="Personal Errand">Personal Errand</option>
                  <option value="Client Commute">Client Commute</option>
                </select>
              </div>

              {!isOnBreak ? (
                <button
                  type="button"
                  id="btn-start-break"
                  onClick={() => onStartBreak(breakReason)}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Start Break</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-end-break"
                  onClick={onEndBreak}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Work</span>
                </button>
              )}
            </div>

            {/* Check out form */}
            <form onSubmit={handlePunchOutSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Summary / Accomplishments (Optional)
                </label>
                <input
                  type="text"
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  placeholder="e.g. Completed attendance module, closed 3 pull requests"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="btn-punch-out"
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Punch Out & Conclude Day</span>
              </button>
            </form>
          </div>
        )}

        {/* CASE 3: Already checked out today */}
        {isCheckedOut && (
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 text-center space-y-2">
            <p className="text-xs font-semibold text-blue-900">
              You have completed your shift for today!
            </p>
            <p className="text-xs text-blue-700">
              Recorded Productive Hours: <strong className="font-mono">{todayRecord?.netWorkHours} hrs</strong> (Check-in: {todayRecord?.checkInTime} • Check-out: {todayRecord?.checkOutTime})
            </p>
            {todayRecord?.checkOutNotes && (
              <p className="text-[11px] text-slate-600 italic">
                "{todayRecord.checkOutNotes}"
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
