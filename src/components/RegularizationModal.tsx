import React from 'react';
import { X, Clock, FileCheck2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  onSubmit: (data: {
    date: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    reason: string;
  }) => void;
}

export const RegularizationModal: React.FC<RegularizationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
}) => {
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [requestedCheckIn, setRequestedCheckIn] = React.useState('09:00');
  const [requestedCheckOut, setRequestedCheckOut] = React.useState('18:00');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please provide a specific reason for attendance regularization.');
      return;
    }

    onSubmit({
      date,
      requestedCheckIn: `${requestedCheckIn}:00`,
      requestedCheckOut: `${requestedCheckOut}:00`,
      reason,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in zoom-in duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Request Regularization</h3>
              <p className="text-[11px] text-slate-500">
                Fix missed punches or system device discrepancies
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

        <form onSubmit={handleSubmit} className="space-y-4 my-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date to Regularize
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Actual Punch In Time
              </label>
              <input
                type="time"
                value={requestedCheckIn}
                onChange={(e) => setRequestedCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Actual Punch Out Time
              </label>
              <input
                type="time"
                value={requestedCheckOut}
                onChange={(e) => setRequestedCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Explanation
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric device offline, client onsite direct visit, forgot to punch out due to late sprint deployment..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Submit to HR
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
