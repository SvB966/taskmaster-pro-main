<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/185OVrom7GIU4RnrJU5L3cRVtMuh1MNMu

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional)
3. Run the app (starts both backend and frontend):
   `npm run dev`

The backend server runs on `http://localhost:3002` and uses a local SQLite database (`server/tasks.db`).
The frontend runs on `http://localhost:3000`.

## Backend Setup

The application uses a lightweight Node.js/Express backend with SQLite.
- **Database**: SQLite (`server/tasks.db`)
- **API Endpoints**:
  - `GET /api/tasks`: Fetch all tasks
  - `POST /api/tasks`: Create a new task
  - `PUT /api/tasks/:id`: Update a task
  - `DELETE /api/tasks/:id`: Delete a task

No additional environment variables are required for the database.
