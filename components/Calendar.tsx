import React, { useMemo } from 'react';
import { DAYS, Task, TaskStatus } from '../types';

interface CalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasks: Task[];
}

export const Calendar: React.FC<CalendarProps> = ({ currentMonth, selectedDate, onSelectDate, tasks }) => {
  // Helpers to calculate grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday
  
  // Generate days array
  const daysArray = [];
  // Fill empty slots for previous month
  for (let i = 0; i < startingDayIndex; i++) {
    daysArray.push(null);
  }
  // Fill actual days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  // Format YYYY-MM-DD for comparison
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const key = t.date;
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  return (
    <div className="h-full flex flex-col border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 transition-colors duration-200">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-sky-100 dark:bg-slate-800 border-b border-sky-300 dark:border-slate-600">
        {DAYS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-[1px] border-l border-slate-200 dark:border-slate-700">
        {daysArray.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="bg-slate-50 dark:bg-slate-800/50 min-h-[80px]" />;
          }

          const dateStr = formatDate(date);
          const isSelected = formatDate(selectedDate) === dateStr;
          const isToday = formatDate(new Date()) === dateStr;
          
          const daysTasks = tasksByDate.get(dateStr) || [];
          const hasNotStarted = daysTasks.some(t => t.status === TaskStatus.NOT_STARTED);
          const hasInProgress = daysTasks.some(t => t.status === TaskStatus.IN_PROGRESS);
          const hasCompleted = daysTasks.some(t => t.status === TaskStatus.COMPLETED);

          return (
            <div 
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={`
                relative min-h-[80px] p-1 cursor-pointer transition-colors bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-750
                ${isSelected ? '!bg-sky-100 dark:!bg-sky-900/30 ring-2 ring-inset ring-sky-500 dark:ring-sky-400 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                  ${isToday ? 'bg-red-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}
                `}>
                  {date.getDate()}
                </span>
                
                {/* Task Indicators (Dots) */}
                <div className="flex gap-1 mt-1">
                   {hasNotStarted && <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" title="Not Started Tasks"></div>}
                   {hasInProgress && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" title="In Progress Tasks"></div>}
                   {hasCompleted && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" title="Completed Tasks"></div>}
                </div>
              </div>
              
              {/* Mini List Preview (Desktop only) */}
              <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                 {daysTasks.slice(0, 3).map(task => (
                   <div 
                    key={task.id} 
                    className="text-[10px] truncate px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                   >
                     {task.title}
                   </div>
                 ))}
                 {daysTasks.length > 3 && (
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{daysTasks.length - 3} more</div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};