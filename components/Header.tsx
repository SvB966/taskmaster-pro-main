import React from 'react';
import { MONTHS } from '../types';
import { ChevronLeft, ChevronRight, Moon, Sun, Layout, BarChart2 } from 'lucide-react';

interface HeaderProps {
  currentDate: Date;
  onMonthChange: (index: number) => void;
  onYearChange: (increment: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentView: 'calendar' | 'dashboard' | 'taskDetail';
  setView: (view: 'calendar' | 'dashboard') => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentDate, 
  onMonthChange, 
  onYearChange, 
  darkMode, 
  toggleDarkMode,
  currentView,
  setView,
  onBack
}) => {
  const currentMonthIndex = currentDate.getMonth();

  return (
    <header className="bg-gradient-to-b from-sky-600 to-sky-700 dark:from-slate-800 dark:to-slate-900 text-white shadow-md transition-colors duration-200">
      <div className="flex flex-col">
        {/* Top Controls: Year & Prev/Next Month */}
        <div className="flex justify-between items-center p-3 border-b border-sky-500 dark:border-slate-700">
          <div className="flex items-center gap-6">
             {/* Logo */}
             <div className="text-2xl font-bold tracking-tight drop-shadow-sm flex items-center gap-2">
              <span>TaskMaster</span>
              <span className="text-sky-200 dark:text-sky-400 font-light bg-white/10 dark:bg-slate-700/50 px-1.5 rounded text-sm uppercase tracking-widest">Pro</span>
             </div>

             {/* View Switcher (Tabs) */}
             <div className="hidden md:flex bg-sky-800/40 dark:bg-slate-700/40 rounded-lg p-1">
                {currentView === 'taskDetail' ? (
                  <button 
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-slate-600 text-sky-700 dark:text-white shadow-sm transition-all"
                  >
                    <ChevronLeft size={16} /> Back to Calendar
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setView('calendar')}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        ${currentView === 'calendar' 
                          ? 'bg-white dark:bg-slate-600 text-sky-700 dark:text-white shadow-sm' 
                          : 'text-sky-100 hover:bg-sky-700/50 dark:text-slate-300 dark:hover:bg-slate-600/50'}
                      `}
                    >
                      <Layout size={16} /> Calendar
                    </button>
                    <button 
                      onClick={() => setView('dashboard')}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        ${currentView === 'dashboard' 
                          ? 'bg-white dark:bg-slate-600 text-sky-700 dark:text-white shadow-sm' 
                          : 'text-sky-100 hover:bg-sky-700/50 dark:text-slate-300 dark:hover:bg-slate-600/50'}
                      `}
                    >
                      <BarChart2 size={16} /> Dashboard
                    </button>
                  </>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Date Controls - Only show in Calendar view */}
             {currentView === 'calendar' && (
               <div className="flex items-center bg-sky-800/50 dark:bg-slate-700/50 rounded-lg px-2 py-1">
                  <button 
                    onClick={() => onYearChange(-1)}
                    className="p-1 hover:bg-sky-600 dark:hover:bg-slate-600 rounded-md transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="mx-3 font-semibold text-lg">{currentDate.getFullYear()}</span>
                  <button 
                    onClick={() => onYearChange(1)}
                    className="p-1 hover:bg-sky-600 dark:hover:bg-slate-600 rounded-md transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
               </div>
             )}

            <div className="h-6 w-px bg-sky-500 dark:bg-slate-600 mx-1"></div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} className="text-yellow-300" /> : <Moon size={18} className="text-sky-100" />}
            </button>
            
            {currentView === 'calendar' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const prev = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
                    if (currentMonthIndex === 0) onYearChange(-1);
                    onMonthChange(prev);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 dark:hover:from-emerald-500 dark:hover:to-emerald-700 text-white shadow rounded text-sm font-semibold flex items-center gap-2 border border-emerald-700 dark:border-emerald-900 transition-all"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button 
                  onClick={() => {
                    const next = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
                    if (currentMonthIndex === 11) onYearChange(1);
                    onMonthChange(next);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 dark:hover:from-emerald-500 dark:hover:to-emerald-700 text-white shadow rounded text-sm font-semibold flex items-center gap-2 border border-emerald-700 dark:border-emerald-900 transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Month Tabs - Only in Calendar View */}
        {currentView === 'calendar' && (
          <div className="flex overflow-x-auto custom-scrollbar bg-sky-800/30 dark:bg-slate-950/50 px-2 pt-2 gap-1 select-none">
            {MONTHS.map((month, index) => {
              const isActive = index === currentMonthIndex;
              return (
                <button
                  key={month}
                  onClick={() => onMonthChange(index)}
                  className={`
                    px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'bg-slate-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300 translate-y-[1px] shadow-[0_-2px_4px_rgba(0,0,0,0.1)]' 
                      : 'bg-sky-800/40 dark:bg-slate-800/30 text-sky-100/80 dark:text-slate-400 hover:bg-sky-700/60 dark:hover:bg-slate-700/60 hover:text-white'
                    }
                  `}
                >
                  {month}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
