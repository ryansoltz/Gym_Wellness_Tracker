## Overview

A full stack web app for tracking workouts, fitness goals, personal records, and daily wellness metrics. Written using React w/ Typescript for the frontend, Python for the backend, and a PostgreSQL database for storing data. Made for CISC 450 - Database Design. Developed by Joshua Mburu and Ryan Soltis



## Usage Instructions

After successfully getting the webapp running and going to the local URL (after following the Installation Instructions), make an account/log in to the app. Once logged in, you are able to access the features of the app:
- Log workout sessions with exercises, sets, reps, and weight
- Track personal records automatically
- Fitness goal creation and tracking
- Body weight logging
- Wellness logging (sleep, mood, energy, hydration)
- Wellness vs. performance correlation report
- Workout summary dashboard
- Create/delete exercises
  
The app can be used daily to do these things, and will remember user data even after logging out, so it is a good way to track your fitness/wellness over time.

## Installation Instructions

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


