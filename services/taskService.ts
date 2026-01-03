import { Task } from '../types';

const API_URL = 'http://localhost:3002/api/tasks';

export const taskService = {
  getAllTasks: async (): Promise<Task[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const newTask: Task = {
      ...task,
      // Ensure defaults if not provided (handling legacy calls or partial objects)
      endTime: task.endTime || calculateDefaultEndTime(task.startTime),
      subtasks: task.subtasks || [],
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });

    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  updateTask: async (updatedTask: Task): Promise<Task> => {
    const taskToUpdate = { ...updatedTask, updatedAt: Date.now() };
    const response = await fetch(`${API_URL}/${updatedTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskToUpdate),
    });

    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete task');
  }
};

// Helper to add 1 hour to start time for default end time
function calculateDefaultEndTime(startTime: string): string {
  if (!startTime) return '10:00';
  const [h, m] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m + 60);
  const newH = date.getHours().toString().padStart(2, '0');
  const newM = date.getMinutes().toString().padStart(2, '0');
  return `${newH}:${newM}`;
}