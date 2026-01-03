import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let db;

async function initializeDb() {
  db = await open({
    filename: './server/tasks.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      subtasks TEXT,
      status TEXT,
      archived INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    )
  `);

  // Ensure archived column exists for existing databases without dropping data
  const columns = await db.all("PRAGMA table_info(tasks)");
  const hasArchived = columns.some(col => col.name === 'archived');
  if (!hasArchived) {
    await db.exec('ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0');
  }
  console.log('Database connected and initialized');
}

initializeDb().catch(err => {
  console.error("Failed to initialize database", err);
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.all('SELECT * FROM tasks');
    const parsedTasks = tasks.map(t => ({
      ...t,
      subtasks: JSON.parse(t.subtasks || '[]'),
      archived: Boolean(t.archived)
    }));
    res.json(parsedTasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = req.body;
    const { id, title, description, date, startTime, endTime, subtasks, status, archived = false, createdAt, updatedAt } = task;
    await db.run(
      `INSERT INTO tasks (id, title, description, date, startTime, endTime, subtasks, status, archived, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,[id, title, description, date, startTime, endTime, JSON.stringify(subtasks), status, archived ? 1 : 0, createdAt, updatedAt]
    );
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;
    const { title, description, date, startTime, endTime, subtasks, status, archived = false, updatedAt } = task;
    
    await db.run(
      `UPDATE tasks SET title = ?, description = ?, date = ?, startTime = ?, endTime = ?, subtasks = ?, status = ?, archived = ?, updatedAt = ? WHERE id = ?`,
      [title, description, date, startTime, endTime, JSON.stringify(subtasks), status, archived ? 1 : 0, updatedAt, id]
    );
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
