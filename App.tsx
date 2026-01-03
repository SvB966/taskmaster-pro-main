import React, { useState, useEffect } from 'react';
import { Layout } from 'lucide-react';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { TaskPanel } from './components/TaskPanel';
import { TaskDetail } from './components/TaskDetail';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { Task } from './types';
import { taskService } from './services/taskService';

// Current date state helpers
const getToday = () => new Date();

export default function App() {
  const [currentDate, setCurrentDate] = useState(getToday()); // The month we are viewing
  const [selectedDate, setSelectedDate] = useState(getToday()); // The specific day selected
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'calendar' | 'dashboard' | 'admin' | 'taskDetail'>('calendar');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const storedTasks = await taskService.getAllTasks();
        setTasks(storedTasks);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load tasks. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  // CRUD Operations
  const handleCreateTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await taskService.createTask(task);
      setTasks(prev => [...prev, newTask]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const savedTask = await taskService.updateTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to delete task');
    }
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const handleYearChange = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    setCurrentDate(newDate);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentView('taskDetail');
  };

  const handleBackToCalendar = () => {
    setSelectedTaskId(null);
    setCurrentView('calendar');
  };

  // Get selected task safely
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative z-50" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}
      {/* Top Header / Navigation Bar simulating the "Tabs" look */}
      <Header 
        currentDate={currentDate} 
        onMonthChange={handleMonthChange}
        onYearChange={handleYearChange}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        currentView={currentView}
        setView={setCurrentView}
        onBack={handleBackToCalendar}
      />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        {currentView === 'taskDetail' && selectedTask ? (
           <div className="w-full h-full">
             <TaskDetail 
               task={selectedTask} 
               onBack={handleBackToCalendar}
               onUpdate={handleUpdateTask}
             />
           </div>
        ) : currentView === 'calendar' ? (
          <>
            {/* Left Side: Calendar View */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors duration-200">
               <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2 pl-2">
                    <Layout className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
               </div>
               
               <div className="flex-1 p-4 overflow-auto bg-slate-50 dark:bg-slate-900/50">
                 <Calendar 
                    currentMonth={currentDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    tasks={tasks}
                 />
               </div>
            </div>

            {/* Right Side: Task Panel */}
            <div className="w-[420px] flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
              <TaskPanel 
                selectedDate={selectedDate} 
                tasks={tasks} 
                onAdd={handleCreateTask}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onTaskClick={handleTaskClick}
              />
            </div>
          </>
        ) : currentView === 'admin' ? (
          <div className="w-full h-full">
            <Admin 
              tasks={tasks}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
            />
          </div>
        ) : (
          /* Dashboard View */
          <div className="w-full h-full">
            <Dashboard tasks={tasks} currentDate={currentDate} />
          </div>
        )}
      </main>
    </div>
  );
}
