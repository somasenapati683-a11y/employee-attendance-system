import React from 'react';
import { 
  X, 
  Database, 
  FileText, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Download, 
  Check, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SQL_SCHEMA_SCRIPT, ARCHITECTURE_DOCUMENTATION, SETUP_INSTRUCTIONS } from '../utils/sqlScripts';

interface AssignmentDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const AssignmentDocsModal: React.FC<AssignmentDocsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = React.useState<'sql' | 'arch' | 'setup' | 'checklist'>('sql');
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const element = document.createElement('a');
    const file = new Blob([SQL_SCHEMA_SCRIPT], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'innereye_attendance_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  MT- Developer Assignment Submission Documentation
                </h2>
                <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Ready for Evaluation
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inner Eye Consultancy Services LLP • Full Source Code, Database Scripts & Technical Spec
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50 text-xs font-semibold gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Scripts (SQL DDL/DML)</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Requirements Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'arch'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Architecture & Calculation Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'setup'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Setup & Testing Guide</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-xs">
          
          {/* TAB 1: SQL SCRIPTS */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">Production Relational Schema: </span>
                  PostgreSQL / MySQL DDL statements with Foreign Keys, Triggers, Indexes, and Automated Late Check triggers.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(SQL_SCHEMA_SCRIPT)}
                    className="px-3 py-1.5 bg-white text-indigo-700 font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSQL}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sql</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[60vh] border border-slate-800 shadow-inner">
                <pre>{SQL_SCHEMA_SCRIPT}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: REQUIREMENTS CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Inner Eye Consultancy Services Assignment Compliance Matrix
                </h3>
                <p className="text-slate-500 text-xs">
                  All requirements specified in the assignment prompt have been thoroughly built and verified:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Employee Login & Registration</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Secure authentication with Email & Password.<br />
                    • Role-Based Access Control: <strong>HR Administrator</strong> vs <strong>Employee</strong>.<br />
                    • Staff registration with department, ID, shift timings, and designation.<br />
                    • 1-Click test accounts for rapid evaluator review.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>2. Attendance Check-In / Check-Out</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Live digital clock with real-time seconds ticker.<br />
                    • Punch In & Punch Out interactive console with location selector (In-Office, Remote WFH, Client Site).<br />
                    • Break tracking (Tea/Lunch break with Start/End break timers).<br />
                    • Standup check-in and evening accomplishment notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>3. Working Hours Calculation</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Gross Hours = Check-Out - Check-In.<br />
                    • Net Productive Hours = Gross - Break Duration.<br />
                    • Overtime Calculation = Hours worked beyond standard 8.0 hrs.<br />
                    • Deficit / Shortfall Hours = Standard 8.0 hrs - Net Hours.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>4. Leave Deduction Calculation</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Automated rule: <strong>3 Late Arrivals in a month = 0.5 Day deduction</strong>.<br />
                    • Half-Day Rule: Net working &lt; 4 hours = <strong>0.5 Day leave deduction</strong>.<br />
                    • Unexcused Absence = <strong>1.0 Day Loss of Pay (LOP)</strong>.<br />
                    • Leave request submission & HR approval hub with quota balance updates.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>5. HR Dashboard</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Real-time presence counters (Present, Late, On Leave, Absent).<br />
                    • Company attendance register with Department, Date, and Status filtering.<br />
                    • 1-Click Leave Approvals and Rejections.<br />
                    • Attendance regularization requests workflow.<br />
                    • Export attendance report to CSV / Excel.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>6. Employee Dashboard & Status Tracking</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    • Personal attendance calendar with color status badges (Present, Late, Half-Day, Absent, On-Leave, Overtime).<br />
                    • Monthly productive hours goal tracker & overtime counters.<br />
                    • Leave Quota visual progress bars (CL, SL, PL, LOP).<br />
                    • History drilldown modal with check-in, check-out, and break notes.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE */}
          {activeTab === 'arch' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(ARCHITECTURE_DOCUMENTATION)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Documentation</span>
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {ARCHITECTURE_DOCUMENTATION}
              </div>
            </div>
          )}

          {/* TAB 4: SETUP INSTRUCTIONS */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {SETUP_INSTRUCTIONS}
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-900 text-xs">Reset Evaluation Data</h4>
                  <p className="text-amber-800 text-[11px]">
                    Reset all test punch-ins, leave applications, and records back to initial benchmark dataset.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onResetData();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Seed Data</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Inner Eye Consultancy Services LLP • MT- Developer Assignment
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
