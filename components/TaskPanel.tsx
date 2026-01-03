import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus, Subtask } from '../types';
import { PlusCircle, Save, Trash2, X, Clock, AlertCircle, CheckSquare, Square, Plus, Eye, GripVertical, Pencil } from 'lucide-react';

interface TaskPanelProps {
  selectedDate: Date;
  tasks: Task[];
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

// Helper: Convert "HH:MM" to minutes from midnight
const getMinutesFromTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: Convert minutes from midnight to "HH:MM"
const getTimeFromMinutes = (totalMinutes: number) => {
  let h = Math.floor(totalMinutes / 60) % 24;
  let m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Helper: Current time as "HH:MM"
const getCurrentTimeString = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const createDefaultFormData = () => {
  const defaultDuration = 120;
  const start = getCurrentTimeString();
  const end = getTimeFromMinutes(getMinutesFromTime(start) + defaultDuration);

  return {
    title: '',
    description: '',
    startTime: start,
    endTime: end,
    duration: defaultDuration,
    status: TaskStatus.NOT_STARTED,
    subtasks: [] as Subtask[]
  };
};

export const TaskPanel: React.FC<TaskPanelProps> = ({ selectedDate, tasks, onAdd, onUpdate, onDelete, onTaskClick }) => {
  // Format YYYY-MM-DD
  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayTasks = useMemo(() => tasks.filter(t => t.date === dateStr), [tasks, dateStr]);
  const sortedDayTasks = useMemo(() => [...dayTasks].sort((a, b) => a.startTime.localeCompare(b.startTime)), [dayTasks]);

  const [isEditing, setIsEditing] = useState<string | null>(null); // Task ID or null
  
  // Form State
  const [formData, setFormData] = useState(() => createDefaultFormData());

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Reset form when changing days or stopping edit
  useEffect(() => {
    resetForm();
    setIsEditing(null);
  }, [selectedDate]);

  const resetForm = () => {
    setFormData(createDefaultFormData());
    setNewSubtaskTitle('');
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleNewTaskClick = () => {
    setIsEditing(null);
    setFormData(createDefaultFormData());
    document.getElementById('title-input')?.focus();
  };

  const handleViewDetails = () => {
    if (!isEditing) return;
    onTaskClick && onTaskClick(isEditing);
  };

  const handleStartEdit = (task: Task) => {
    setIsEditing(task.id);
    const sMin = getMinutesFromTime(task.startTime);
    const eMin = getMinutesFromTime(task.endTime || task.startTime); 
    const duration = eMin >= sMin ? eMin - sMin : (24 * 60 - sMin) + eMin; // Handle overflow roughly

    setFormData({
      title: task.title,
      description: task.description,
      startTime: task.startTime,
      endTime: task.endTime || task.startTime,
      duration: duration === 0 ? 60 : duration, // Default to 60 if calc is 0 or missing
      status: task.status,
      subtasks: task.subtasks || []
    });
  };

  // Time Logic Handlers
  const handleStartTimeChange = (val: string) => {
    const startMins = getMinutesFromTime(val);
    const endMins = startMins + formData.duration;
    setFormData({
      ...formData,
      startTime: val,
      endTime: getTimeFromMinutes(endMins)
    });
  };

  const handleEndTimeChange = (val: string) => {
    const startMins = getMinutesFromTime(formData.startTime);
    let endMins = getMinutesFromTime(val);
    if (endMins < startMins) endMins += 24 * 60; // Assume next day overlap if end < start
    const newDuration = endMins - startMins;
    setFormData({
      ...formData,
      endTime: val,
      duration: newDuration
    });
  };

  const handleDurationChange = (val: number) => {
    const startMins = getMinutesFromTime(formData.startTime);
    const endMins = startMins + val;
    setFormData({
      ...formData,
      duration: val,
      endTime: getTimeFromMinutes(endMins)
    });
  };

  // Subtask Logic
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle,
      completed: false
    };
    setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, newSub] }));
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setFormData(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

  const startEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const commitEditSubtask = () => {
    if (!editingSubtaskId) return;
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === editingSubtaskId ? { ...st, title: editingSubtaskTitle.trim() || st.title } : st)
    }));
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleSubtaskReorder = (activeId: string, overId: string) => {
    setFormData(prev => {
      const oldIndex = prev.subtasks.findIndex(st => st.id === activeId);
      const newIndex = prev.subtasks.findIndex(st => st.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, subtasks: arrayMove(prev.subtasks, oldIndex, newIndex) };
    });
  };

  const toggleSubtaskInList = (task: Task, subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingSubtaskId) {
      commitEditSubtask();
      return;
    }

    if (isEditing) {
      const original = tasks.find(t => t.id === isEditing);
      if (original) {
        onUpdate({
          ...original,
          ...formData,
          date: dateStr 
        });
      }
      setIsEditing(null);
    } else {
      onAdd({
        ...formData,
        date: dateStr
      });
    }
    resetForm();
  };

  const statusColors = {
    [TaskStatus.NOT_STARTED]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    [TaskStatus.IN_PROGRESS]: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    [TaskStatus.COMPLETED]: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header Panel */}
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
               {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}
             </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">{dayTasks.length} tasks scheduled</p>
           </div>
           
           <div className="flex gap-2">
             {!isEditing ? (
               <button 
                onClick={handleNewTaskClick}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-medium transition-colors"
               >
                 <PlusCircle size={16} /> New Task
               </button>
             ) : (
               <button 
                 onClick={() => { setIsEditing(null); resetForm(); }}
                 className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
               >
                 <X size={16} /> Cancel
               </button>
             )}

             <button
               type="button"
               onClick={handleViewDetails}
               disabled={!isEditing}
               className={`flex items-center gap-1 px-3 py-1.5 rounded shadow text-sm font-medium transition-colors border
                 ${isEditing
                   ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600'
                   : 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'}
               `}
               title={isEditing ? 'Open detail view for this task' : 'Select a task to enable'}
             >
               <Eye size={16} /> View Details
             </button>
           </div>
        </div>

        {/* Edit/Create Form */}
        <form onSubmit={handleSubmit} className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner transition-colors duration-200">
          <div className="space-y-3">
             {/* Row 1: Title */}
             <div>
               <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Task Name</label>
               <input 
                 id="title-input"
                 type="text" 
                 required
                 value={formData.title}
                 onChange={e => setFormData({...formData, title: e.target.value})}
                 className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                 placeholder="e.g. Project Review..."
               />
             </div>
             
             {/* Row 2: Timing */}
             <div className="grid grid-cols-3 gap-2">
               <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Start</label>
                  <input 
                    type="time" 
                    value={formData.startTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                  />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">End</label>
                  <input 
                    type="time" 
                    value={formData.endTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                  />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duration (min)</label>
                  <input 
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={e => handleDurationChange(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                  />
               </div>
             </div>

             {/* Row 3: Status */}
             <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                >
                  {Object.values(TaskStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
             </div>

             {/* Row 4: Subtasks */}
             <div className="bg-white dark:bg-slate-700/50 p-2 rounded border border-slate-200 dark:border-slate-600 transition-colors">
               <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Subtasks</label>
               
               <div className="space-y-2 mb-2">
                 <DndContext
                   sensors={sensors}
                   collisionDetection={closestCenter}
                   onDragEnd={({ active, over }) => {
                     if (over && active.id !== over.id) handleSubtaskReorder(String(active.id), String(over.id));
                   }}
                 >
                   <SortableContext items={formData.subtasks.map(st => st.id)} strategy={verticalListSortingStrategy}>
                     {formData.subtasks.map(st => (
                       <SortableSubtaskRow
                         key={st.id}
                         subtask={st}
                         isEditing={editingSubtaskId === st.id}
                         editingTitle={editingSubtaskTitle}
                         onChangeTitle={setEditingSubtaskTitle}
                         onStartEdit={() => startEditSubtask(st)}
                         onCommitEdit={commitEditSubtask}
                         onRemove={() => handleRemoveSubtask(st.id)}
                       />
                     ))}
                   </SortableContext>
                 </DndContext>
               </div>

               <div className="flex gap-2">
                 <input 
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(e); }}
                    placeholder="Add a subtask..."
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-500 rounded focus:ring-2 focus:ring-sky-500 outline-none bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                 />
                 <button 
                   type="button"
                   onClick={handleAddSubtask}
                   className="px-2 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors"
                 >
                   <Plus size={16} />
                 </button>
               </div>
             </div>

             {/* Row 5: Description */}
             <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description (Optional)</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  placeholder="Additional details..."
                />
             </div>

             <button 
               type="submit"
               className="w-full flex justify-center items-center gap-2 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded text-sm font-bold shadow hover:from-sky-600 hover:to-blue-700 transition-all"
             >
               <Save size={16} /> {isEditing ? 'Update Task' : 'Save Task'}
             </button>
          </div>
        </form>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
         {dayTasks.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Clock size={48} className="mb-2 opacity-50" />
              <p className="text-sm">No tasks scheduled for this day.</p>
           </div>
         ) : (
           <div className="space-y-3">
             {sortedDayTasks.map(task => {
                const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
                const totalSubtasks = (task.subtasks || []).length;
                
                return (
                 <div 
                   key={task.id}
                   className={`
                      group relative p-3 rounded-lg border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all
                      ${isEditing === task.id ? 'ring-2 ring-sky-400 border-transparent' : 'border-slate-200 dark:border-slate-700'}
                   `}
                 >
                   {/* Task Header */}
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {task.startTime} - {task.endTime || '??:??'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[task.status]}`}>
                            {task.status}
                          </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleStartEdit(task)}
                         className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                         title="Edit"
                       >
                         <AlertCircle size={14} />
                       </button>
                       <button 
                          onClick={() => onDelete(task.id)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          title="Delete"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </div>
                   
                   <h4 
                     className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight mb-1 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                     onClick={() => onTaskClick && onTaskClick(task.id)}
                   >
                     {task.title}
                   </h4>
                   
                   {task.description && (
                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                       {task.description}
                     </p>
                   )}

                   {/* Subtasks List */}
                   {(task.subtasks && task.subtasks.length > 0) && (
                     <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subtasks</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                        <div className="space-y-1">
                           {task.subtasks.map(st => (
                             <div 
                               key={st.id} 
                               className="flex items-start gap-2 text-sm group/subtask cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 -mx-1 rounded transition-colors"
                               onClick={() => toggleSubtaskInList(task, st.id)}
                             >
                               <div className="mt-0.5 text-slate-400 group-hover/subtask:text-sky-500 dark:text-slate-500 dark:group-hover/subtask:text-sky-400">
                                 {st.completed ? <CheckSquare size={14} className="text-emerald-500" /> : <Square size={14} />}
                               </div>
                               <span className={`flex-1 text-slate-600 dark:text-slate-300 ${st.completed ? 'line-through opacity-70' : ''}`}>
                                 {st.title}
                               </span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}
      </div>
    </div>
  );
};

// Sortable subtask row with inline edit support
const SortableSubtaskRow: React.FC<{
  subtask: Subtask;
  isEditing: boolean;
  editingTitle: string;
  onChangeTitle: (val: string) => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onRemove: () => void;
}> = ({ subtask, isEditing, editingTitle, onChangeTitle, onStartEdit, onCommitEdit, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-100 dark:border-slate-600"
    >
      <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={editingTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onCommitEdit(); }
            if (e.key === 'Escape') { e.preventDefault(); onCommitEdit(); }
          }}
          className="flex-1 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-100"
        />
      ) : (
        <button type="button" className="flex-1 text-left text-sm truncate text-slate-700 dark:text-slate-200" onClick={onStartEdit}>
          {subtask.title}
        </button>
      )}

      {!isEditing && (
        <button type="button" onClick={onStartEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Pencil size={14} />
        </button>
      )}

      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};