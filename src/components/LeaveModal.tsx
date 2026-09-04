import React from 'react';
import { X, Calendar, AlertCircle, Send, Check } from 'lucide-react';
import { Employee, LeaveType } from '../types';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  onSubmit: (data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
  }) => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
}) => {
  const [leaveType, setLeaveType] = React.useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  // Calculate days count
  const calculateDays = (): number => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysCount = calculateDays();

  // Check balance
  const getBalance = (type: LeaveType): number => {
    switch (type) {
      case 'Casual Leave':
        return currentUser.leaveBalance.casualLeave;
      case 'Sick Leave':
        return currentUser.leaveBalance.sickLeave;
      case 'Privilege Leave':
        return currentUser.leaveBalance.privilegeLeave;
      default:
        return 999;
    }
  };

  const currentAvailableQuota = getBalance(leaveType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (daysCount <= 0) {
      setError('End date must be on or after start date.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for leave application.');
      return;
    }

    if (leaveType !== 'Loss of Pay' && daysCount > currentAvailableQuota) {
      setError(
        `Insufficient ${leaveType} balance. You requested ${daysCount} day(s) but only have ${currentAvailableQuota} day(s) left.`
      );
      return;
    }

    onSubmit({
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      daysCount,
      reason,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Apply for Leave</h3>
              <p className="text-[11px] text-slate-500">
                Submit request for HR review and automated balance tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4 text-xs">
          
          {/* Leave Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Leave Category & Available Quota
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Casual Leave', 'Sick Leave', 'Privilege Leave', 'Loss of Pay'] as LeaveType[]).map((type) => {
                const bal = getBalance(type);
                const isSelected = leaveType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setLeaveType(type)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{type}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {type === 'Loss of Pay' ? 'Unpaid deduction' : `Balance: ${bal} days`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Half day checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chk-half-day"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="chk-half-day" className="font-medium text-slate-700 cursor-pointer">
              Apply for Half-Day (0.5 day leave)
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (isHalfDay) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {!isHalfDay && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Duration Summary */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600">Calculated Leave Duration:</span>
            <span className="font-bold font-mono text-indigo-700 text-sm">
              {daysCount} Day{daysCount > 1 ? 's' : ''}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details for HR review (e.g. personal appointment, sick rest)..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Leave Request</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
