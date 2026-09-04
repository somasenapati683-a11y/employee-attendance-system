import React from 'react';
import { 
  Building2, 
  Clock, 
  UserCheck, 
  LogOut, 
  FileCode2, 
  ChevronDown, 
  ShieldAlert, 
  User,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { Employee } from '../types';

interface NavbarProps {
  currentUser: Employee;
  employees: Employee[];
  onSwitchUser: (employee: Employee) => void;
  onOpenDocs: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeView: 'dashboard' | 'calendar' | 'leaves' | 'deductions';
  setActiveView: (view: 'dashboard' | 'calendar' | 'leaves' | 'deductions') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  employees,
  onSwitchUser,
  onOpenDocs,
  onOpenAuth,
  onLogout,
  activeView,
  setActiveView,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Organization */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  INNER EYE
                </span>
                <span className="text-xs px-1.5 py-0.5 font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 hidden sm:inline-block">
                  Consultancy Services LLP
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Employee Attendance & Leave Management Portal
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Date */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-medium text-slate-800">{formattedTime}</span>
            <span className="text-slate-300">•</span>
            <span>{formattedDate}</span>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Developer Assignment & Database Docs CTA */}
            <button
              id="btn-open-assignment-docs"
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="View SQL Scripts, DDL, Architecture & Setup Docs for Assignment Review"
            >
              <FileCode2 className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">DB Scripts & Spec</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-600 text-white rounded-full font-mono">SQL</span>
            </button>

            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                id="btn-user-switch-dropdown"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-slate-900 leading-tight flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.role === 'hr_admin' ? (
                      <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 font-semibold rounded">
                        HR
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold rounded">
                        Staff
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[110px]">
                    {currentUser.designation}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Current Profile
                    </p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{currentUser.name}</p>
                    <p className="text-slate-500 text-[11px]">{currentUser.email} • {currentUser.id}</p>
                  </div>

                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quick Switch Demo Role</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {employees.map((emp) => {
                      const isSelected = emp.id === currentUser.id;
                      return (
                        <button
                          key={emp.id}
                          onClick={() => onSwitchUser(emp)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                emp.role === 'hr_admin' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {emp.role === 'hr_admin' ? 'HR ADMIN' : 'EMPLOYEE'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {emp.department} • {emp.designation}
                            </div>
                          </div>
                          {isSelected && (
                            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={onOpenAuth}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Register New Employee / Sign In</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
