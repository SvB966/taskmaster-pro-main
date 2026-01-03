import React from 'react';
import { Task, TaskStatus } from '../types';
import { Trash2, Archive, RotateCcw, ShieldCheck, ListChecks, Circle, CheckCircle } from 'lucide-react';

interface AdminProps {
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const statusPillClasses: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  [TaskStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  [TaskStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const statusDotClasses: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'text-slate-400',
  [TaskStatus.IN_PROGRESS]: 'text-amber-500',
  [TaskStatus.COMPLETED]: 'text-emerald-500',
};

export const Admin: React.FC<AdminProps> = ({ tasks, onUpdate, onDelete }) => {
  const sorted = [...tasks].sort((a, b) => {
    if (a.date === b.date) return a.startTime.localeCompare(b.startTime);
    return a.date.localeCompare(b.date);
  });

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    onUpdate({ ...task, status });
  };

  const handleArchiveToggle = (task: Task) => {
    onUpdate({ ...task, archived: !task.archived });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Admin</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Beheer alle taken, status en archivering.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{tasks.length} total</span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} done
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-5 py-3 font-semibold">Titel</th>
              <th className="px-5 py-3 font-semibold">Datum</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Archief</th>
              <th className="px-5 py-3 font-semibold text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sorted.map(task => (
              <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-3 align-middle">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{task.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{task.description || 'Geen beschrijving'}</span>
                  </div>
                </td>
                <td className="px-5 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(task.date)}</td>
                <td className="px-5 py-3 align-middle">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusPillClasses[task.status]}`}>
                    {task.status === TaskStatus.COMPLETED ? <CheckCircle size={14} className={statusDotClasses[task.status]} /> : <Circle size={14} className={statusDotClasses[task.status]} />}
                    {task.status}
                  </div>
                </td>
                <td className="px-5 py-3 align-middle">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.archived ? 'bg-slate-800 text-slate-100 dark:bg-slate-900 dark:text-slate-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {task.archived ? 'Gearchiveerd' : 'Actief'}
                  </span>
                </td>
                <td className="px-5 py-3 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      {Object.values(TaskStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleArchiveToggle(task)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors border ${task.archived ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}
                      title={task.archived ? 'Terugzetten' : 'Archiveren'}
                    >
                      {task.archived ? <RotateCcw size={14} /> : <Archive size={14} />} {task.archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                      title="Verwijder taak"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <ListChecks size={20} />
                    Geen taken gevonden.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
