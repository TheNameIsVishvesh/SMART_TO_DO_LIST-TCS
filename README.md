# TCS | CHARUSAT — Use Case 23: Smart To-Do List Assistant

This is the backend and database implementation for the Smart To-Do List Assistant.

## Project Structure
- `client/`: React + Vite + Tailwind CSS frontend application. Includes Analytics Dashboard & Reports module.
- `server/`: Node.js + Express + MongoDB backend application. Includes Analytics & PDF/CSV/Excel Generation.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Backend Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   A `.env.example` is provided. The `.env` file should contain:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/smart-todo
   ```

## Database Seed (Demo Data)
To populate the database with realistic university tasks, run:
```bash
npm run seed
```
This will clear existing data and insert the demo tasks.

## Starting the Backend
To start the backend server in development mode (using nodemon):
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

## API Documentation

### Base URL
`http://localhost:5000/api/tasks`

### Endpoints

- `GET /`
  - Retrieves a list of tasks. Supports filtering, search, and sorting.
  - Automatically updates uncompleted tasks to `OVERDUE` if their `dueDate` is past.
  - **Query Parameters**:
    - `status`: Filter by status (`TODO`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`).
    - `priority`: Filter by priority (`LOW`, `MEDIUM`, `HIGH`).
    - `category`: Filter by category (e.g., `Assignment`, `Study`).
    - `deadline`: Filter by deadline (`today`, `upcoming`, `overdue`).
    - `search`: Search within title, description, or tags.
    - `sort`: Sort by a specific field (`deadline`, `-deadline`, `createdAt`, `-createdAt`, `priority`, `-priority`).

- `GET /:id`
  - Retrieves a single task by ID.

- `POST /`
  - Creates a new task.
  - **Body**: See Task Schema.

- `PUT /:id`
  - Updates an existing task by ID.
  - **Body**: Fields to update.

- `DELETE /:id`
  - Deletes a task by ID.

- `POST /:id/complete`
  - Marks a task status as `COMPLETED` and sets the `completedAt` timestamp.

- `POST /:id/reopen`
  - Reopens a completed task. Sets status to `TODO` (or `OVERDUE` if past the due date) and clears the `completedAt` timestamp.

### Analytics & Reports Endpoints

- `GET /api/analytics`
  - Retrieves productivity metrics including total tasks, completed, pending, overdue, priority distribution, category distribution, and weekly completion rates.

- `GET /api/alerts`
  - Retrieves smart alerts for overdue tasks, tasks due today/tomorrow, and high-priority incomplete tasks.

- `GET /api/export/csv`
  - Generates and downloads a CSV report of all tasks.

- `GET /api/export/excel`
  - Generates and downloads an Excel spreadsheet report of all tasks.

- `GET /api/export/pdf`
  - Generates and downloads a formatted PDF Productivity Report.

## Task Model Schema
- `title` (String, required)
- `description` (String)
- `category` (String)
- `tags` (Array of Strings)
- `priority` (String: LOW, MEDIUM, HIGH)
- `priorityScore` (Number)
- `status` (String: TODO, IN_PROGRESS, COMPLETED, OVERDUE)
- `dueDate` (Date)
- `estimatedMinutes` (Number)
- `createdAt` (Date)
- `updatedAt` (Date)
- `completedAt` (Date)
- `source` (String)
- `aiGenerated` (Boolean)
- `extractedText` (String)
- `subtasks` (Array of Objects)
