# Gym & Wellness Tracker

A full stack web app for tracking workouts, fitness goals, personal records, and daily wellness metrics.

Built for CISC 450 — Database Design | University of St. Thomas
**Joshua Mburu & Ryan Soltis**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

## Features

- Log workout sessions with exercises, sets, reps, and weight
- Automatic personal record (PR) detection and tracking
- Progress charts per exercise over time
- Fitness goal creation and tracking
- Daily body weight logging
- Daily wellness check-ins (sleep, mood, energy, hydration)
- Wellness vs. performance correlation report
- Workout summary dashboard

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project (free at supabase.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/gym-wellness-tracker.git
cd gym-wellness-tracker
```

### 2. Set up the database
- Create a free project at [supabase.com](https://supabase.com)
- In the SQL Editor, run the contents of `schema.sql`
- Copy your connection string from Project Settings → Database

### 3. Run the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # add your DATABASE_URL
uvicorn main:app --reload
```
API running at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`

### 4. Run the frontend
```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm run dev
```
App running at `http://localhost:5173`

## Project Structure
