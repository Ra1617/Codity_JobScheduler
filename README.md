# Distributed Job Scheduler

A production-inspired distributed job scheduling platform featuring a glassy modern matte-black and orange React dashboard and a scalable Python FastAPI backend. The system supports queue configuration, immediate/delayed/scheduled/recurring jobs, and autonomous worker node simulations.

---

## 🚀 Quick Start Guide

Follow these instructions to download, set up, and run the project locally on your machine.

### Prerequisites
Before you begin, ensure you have the following installed on your system:
- **Python 3.10+** (for the backend)
- **Node.js 18+** & **npm** (for the frontend dashboard)

---

### 1. Download the Project
1. Download the repository as a `.zip` file from GitHub (or clone it using `git clone`).
2. Extract the contents of the zip file to a folder of your choice.
3. Open your terminal (or Command Prompt / PowerShell) and navigate to the extracted folder.

---

### 2. Backend Setup (FastAPI + SQLite)
The backend manages the queues, job execution state, workers, and API endpoints.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   This isolates the project dependencies from your system's global Python packages.
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows:**
     ```powershell
     venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: This includes `aiosqlite` which is necessary for our async database connection).*

5. **Initialize the local database:**
   This will create a `test.db` SQLite database and generate all necessary tables.
   ```bash
   python init_db.py
   ```

6. **Start the backend server:**
   ```bash
   python main.py
   ```
   *The backend API is now running at `http://localhost:8000`.*

---

### 3. Frontend Setup (React + Vite)
The frontend provides a real-time, premium dashboard to manage and explore your job queues.

1. **Open a new terminal window** (keep the backend server running in the first one).
2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install frontend dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The frontend dashboard is now running at `http://localhost:3000`.*

---

## 🎮 How to Use the Dashboard

1. Open your web browser and go to [http://localhost:3000](http://localhost:3000).
2. **Overview**: View live simulated metrics and worker health status.
3. **Queue Manager**: Inspect active queues and their priority/concurrency settings.
4. **Job Explorer**: View the history of jobs (Queued, Running, Completed, Failed).
5. **Enqueue Jobs**: Use the "Enqueue Job" button in the top right to create new Immediate, Delayed, Scheduled, Cron, or Batch jobs. 

> **Note:** The dashboard defaults to a highly-interactive **Simulation Mode**, which locally mimics a live distributed cluster so you can experiment with backoffs, retries, and job state transitions visually without needing a heavy cloud infrastructure!