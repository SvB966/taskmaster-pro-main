import React, { useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus, Subtask } from '../types';
import { ArrowLeft, Calendar, Clock, CheckCircle, Circle, AlertCircle, Tag, Plus, Trash2, GripVertical, Pencil } from 'lucide-react';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onUpdate: (task: Task) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onBack, onUpdate }) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdate({ ...task, status: newStatus });
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask: Subtask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    
    onUpdate({ 
      ...task, 
      subtasks: [...(task.subtasks || []), newSubtask] 
    });
    setNewSubtaskTitle('');
  };

  const removeSubtask = (subtaskId: string) => {
    onUpdate({
      ...task,
      subtasks: task.subtasks.filter(st => st.id !== subtaskId)
    });
  };

  const startEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const commitEditSubtask = () => {
    if (!editingSubtaskId) return;
    onUpdate({
      ...task,
      subtasks: task.subtasks.map(st => st.id === editingSubtaskId ? { ...st, title: editingSubtaskTitle.trim() || st.title } : st)
    });
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleSubtaskReorder = (activeId: string, overId: string) => {
    const subtasks = task.subtasks || [];
    const oldIndex = subtasks.findIndex(st => st.id === activeId);
    const newIndex = subtasks.findIndex(st => st.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(subtasks, oldIndex, newIndex);
    onUpdate({ ...task, subtasks: reordered });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
      case TaskStatus.IN_PROGRESS: return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const progressRadius = 90;
  const progressCenter = 100;
  const progressCircumference = 2 * Math.PI * progressRadius;

  return (
    <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
          title="Back to Calendar"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Task Details</h2>
        <div className="ml-auto flex gap-2">
           {Object.values(TaskStatus).map(status => (
             <button
               key={status}
               onClick={() => handleStatusChange(status)}
               className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                 task.status === status 
                   ? getStatusColor(status) + ' ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-700' 
                   : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
               }`}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10 lg:px-12 custom-scrollbar">
        <div className="space-y-6 h-full">
          
          {/* Title & Description (Full Width) */}
          <div className="space-y-4">
            <input
              type="text"
              value={task.title}
              onChange={(e) => onUpdate({ ...task, title: e.target.value })}
              className="w-full text-3xl font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-sky-500 focus:outline-none transition-colors placeholder-slate-300"
              placeholder="Task Title"
            />
          </div>

          {/* Top Row: Date/Time controls full-width */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-6 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <Calendar className="text-sky-500" size={20} />
              <div className="flex-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Date</label>
                <input 
                  type="date" 
                  value={task.date}
                  onChange={(e) => onUpdate({ ...task, date: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <Clock className="text-sky-500" size={20} />
              <div className="flex-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Time</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="time" 
                    value={task.startTime}
                    onChange={(e) => onUpdate({ ...task, startTime: e.target.value })}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="time" 
                    value={task.endTime}
                    onChange={(e) => onUpdate({ ...task, endTime: e.target.value })}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Layout: Subtasks + Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Subtasks */}
            <div className="lg:col-span-7 flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between items-center">
                <span>Subtasks</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{totalSubtasks}</span>
              </h3>

              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
                {/* Add Subtask Form */}
                <form onSubmit={addSubtask} className="p-3 border-b border-slate-200 dark:border-slate-600 flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add new subtask..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <button 
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </form>

                {/* Subtasks List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={({ active, over }) => {
                        if (over && active.id !== over.id) handleSubtaskReorder(String(active.id), String(over.id));
                      }}
                    >
                      <SortableContext items={task.subtasks.map(st => st.id)} strategy={verticalListSortingStrategy}>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                          {task.subtasks.map(st => (
                            <DetailSortableSubtaskRow
                              key={st.id}
                              subtask={st}
                              isEditing={editingSubtaskId === st.id}
                              editingTitle={editingSubtaskTitle}
                              onChangeTitle={setEditingSubtaskTitle}
                              onStartEdit={() => startEditSubtask(st)}
                              onCommitEdit={commitEditSubtask}
                              onToggle={() => toggleSubtask(st.id)}
                              onRemove={() => removeSubtask(st.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                      No subtasks yet. Add one above.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="lg:col-span-5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Progress</h3>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center flex-1">
                <div className="relative w-52 h-52 mb-4 flex items-center justify-center">
                  {/* Circular Progress Background */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx={progressCenter}
                      cy={progressCenter}
                      r={progressRadius}
                      stroke="currentColor"
                      strokeWidth="20"
                      fill="transparent"
                      className="text-slate-200 dark:text-slate-600"
                    />
                    <circle
                      cx={progressCenter}
                      cy={progressCenter}
                      r={progressRadius}
                      stroke="currentColor"
                      strokeWidth="20"
                      fill="transparent"
                      strokeDasharray={progressCircumference}
                      strokeDashoffset={progressCircumference - (progressCircumference * completionPercentage) / 100}
                      className={`text-sky-500 transition-all duration-1000 ease-out ${completionPercentage === 100 ? 'text-emerald-500' : ''}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-slate-700 dark:text-slate-200">{completionPercentage}%</span>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                  {completedSubtasks} of {totalSubtasks} completed
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {completionPercentage === 100 ? 'All tasks completed!' : 'Keep going!'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Sortable row for Task Detail subtasks
const DetailSortableSubtaskRow: React.FC<{
  subtask: Subtask;
  isEditing: boolean;
  editingTitle: string;
  onChangeTitle: (val: string) => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}> = ({ subtask, isEditing, editingTitle, onChangeTitle, onStartEdit, onCommitEdit, onToggle, onRemove }) => {
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
      className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 group transition-colors"
    >
      <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>

      <button 
        onClick={onToggle}
        className="flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
      >
        {subtask.completed ? (
          <CheckCircle className="text-emerald-500" size={18} />
        ) : (
          <Circle size={18} />
        )}
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
        <button
          type="button"
          className={`flex-1 text-left text-sm text-slate-700 dark:text-slate-200 ${subtask.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
          onClick={onStartEdit}
        >
          {subtask.title}
        </button>
      )}

      {!isEditing && (
        <button type="button" onClick={onStartEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Pencil size={14} />
        </button>
      )}

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
        title="Remove subtask"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
